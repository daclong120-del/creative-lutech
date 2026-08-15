using System;
using System.Diagnostics;
using System.IO;
using System.Collections.Generic;
using System.Threading;

namespace SinoMedia
{
    class Launcher
    {
        static Process dashboardProcess;
        static Process workerProcess;
        
        static readonly object dashboardLogLock = new object();
        static readonly object workerLogLock = new object();

        static void Main(string[] args)
        {
            Console.WriteLine("========================================");
            Console.WriteLine("        SinoMedia Desktop Runtime       ");
            Console.WriteLine("========================================");

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string nodeExe = Path.Combine(baseDir, "runtime", "node", "node.exe");
            string serverJs = Path.Combine(baseDir, "app", "server.js");
            string workerTsx = Path.Combine(baseDir, "worker", "node_modules", "tsx", "dist", "cli.mjs");
            string workerIndex = Path.Combine(baseDir, "worker", "src", "index.ts");
            string envFile = Path.Combine(baseDir, "config", ".env");
            string logsDir = Path.Combine(baseDir, "logs");

            if (!Directory.Exists(logsDir))
            {
                Directory.CreateDirectory(logsDir);
            }

            if (!File.Exists(nodeExe))
            {
                Console.WriteLine("[ERROR] Embedded Node runtime not found at: " + nodeExe);
                Console.ReadLine();
                return;
            }

            if (!File.Exists(serverJs))
            {
                Console.WriteLine("[ERROR] Dashboard server.js not found at: " + serverJs);
                Console.ReadLine();
                return;
            }

            Dictionary<string, string> envVars = new Dictionary<string, string>();
            if (File.Exists(envFile))
            {
                Console.WriteLine("[INFO] Loading configuration from config/.env");
                string[] lines = File.ReadAllLines(envFile);
                foreach (string line in lines)
                {
                    string tLine = line.Trim();
                    if (!string.IsNullOrEmpty(tLine) && !tLine.StartsWith("#") && tLine.Contains("="))
                    {
                        int idx = tLine.IndexOf("=");
                        string key = tLine.Substring(0, idx).Trim();
                        string val = tLine.Substring(idx + 1).Trim();
                        if ((val.StartsWith("\"") && val.EndsWith("\"")) || (val.StartsWith("'") && val.EndsWith("'")))
                        {
                            val = val.Substring(1, val.Length - 2);
                        }
                        envVars[key] = val;
                    }
                }
            }

            // --- 1. Start Dashboard ---
            Console.WriteLine("[INFO] Starting Dashboard Server...");
            string dashboardLog = Path.Combine(logsDir, "dashboard.log");
            string dashboardErr = Path.Combine(logsDir, "dashboard.err.log");

            ProcessStartInfo dashInfo = new ProcessStartInfo();
            dashInfo.FileName = nodeExe;
            dashInfo.Arguments = "\"" + serverJs + "\"";
            dashInfo.WorkingDirectory = Path.Combine(baseDir, "app");
            dashInfo.UseShellExecute = false;
            dashInfo.RedirectStandardOutput = true;
            dashInfo.RedirectStandardError = true;
            dashInfo.CreateNoWindow = true;

            foreach (var kvp in envVars)
            {
                dashInfo.EnvironmentVariables[kvp.Key] = kvp.Value;
            }
            if (!dashInfo.EnvironmentVariables.ContainsKey("PORT"))
            {
                dashInfo.EnvironmentVariables["PORT"] = "3000";
            }

            dashboardProcess = new Process();
            dashboardProcess.StartInfo = dashInfo;
            dashboardProcess.EnableRaisingEvents = true;

            dashboardProcess.OutputDataReceived += (sender, e) => {
                if (e.Data != null) {
                    lock(dashboardLogLock) { File.AppendAllText(dashboardLog, e.Data + Environment.NewLine); }
                }
            };
            dashboardProcess.ErrorDataReceived += (sender, e) => {
                if (e.Data != null) {
                    lock(dashboardLogLock) { File.AppendAllText(dashboardErr, e.Data + Environment.NewLine); }
                }
            };

            dashboardProcess.Start();
            dashboardProcess.BeginOutputReadLine();
            dashboardProcess.BeginErrorReadLine();
            Console.WriteLine("[OK] Dashboard started. PID: " + dashboardProcess.Id);

            // --- 2. Start Worker (Optional based on auto-start setting) ---
            bool autoStartWorker = envVars.ContainsKey("AUTO_START_WORKER") ? (envVars["AUTO_START_WORKER"].ToLower() == "true") : true;
            
            if (autoStartWorker && File.Exists(workerTsx) && File.Exists(workerIndex))
            {
                Console.WriteLine("[INFO] Starting Crawler Worker...");
                string workerLog = Path.Combine(logsDir, "worker.log");
                string workerErr = Path.Combine(logsDir, "worker.err.log");

                ProcessStartInfo workerInfo = new ProcessStartInfo();
                workerInfo.FileName = nodeExe;
                workerInfo.Arguments = "\"" + workerTsx + "\" \"" + workerIndex + "\" crawl";
                workerInfo.WorkingDirectory = Path.Combine(baseDir, "worker");
                workerInfo.UseShellExecute = false;
                workerInfo.RedirectStandardOutput = true;
                workerInfo.RedirectStandardError = true;
                workerInfo.CreateNoWindow = true;

                foreach (var kvp in envVars)
                {
                    workerInfo.EnvironmentVariables[kvp.Key] = kvp.Value;
                }

                workerProcess = new Process();
                workerProcess.StartInfo = workerInfo;
                workerProcess.EnableRaisingEvents = true;

                workerProcess.OutputDataReceived += (sender, e) => {
                    if (e.Data != null) {
                        lock(workerLogLock) { File.AppendAllText(workerLog, e.Data + Environment.NewLine); }
                    }
                };
                workerProcess.ErrorDataReceived += (sender, e) => {
                    if (e.Data != null) {
                        lock(workerLogLock) { File.AppendAllText(workerErr, e.Data + Environment.NewLine); }
                    }
                };

                workerProcess.Start();
                workerProcess.BeginOutputReadLine();
                workerProcess.BeginErrorReadLine();
                Console.WriteLine("[OK] Worker started. PID: " + workerProcess.Id);
            }
            else
            {
                if (!autoStartWorker) Console.WriteLine("[INFO] Worker auto-start is disabled in config.");
                else Console.WriteLine("[WARN] Worker files not found. Skipping worker start.");
            }

            // --- 3. Open Browser ---
            string port = dashInfo.EnvironmentVariables["PORT"];
            string targetUrl = "http://localhost:" + port;
            Console.WriteLine("[INFO] Opening Browser at " + targetUrl);
            
            // Give the server a second to bind
            Thread.Sleep(1500);
            try {
                Process.Start(new ProcessStartInfo(targetUrl) { UseShellExecute = true });
            } catch (Exception ex) {
                Console.WriteLine("[WARN] Failed to open browser: " + ex.Message);
            }

            Console.WriteLine("\n=======================================================");
            Console.WriteLine("    System is running. Close this window to STOP.      ");
            Console.WriteLine("=======================================================\n");

            // Handle graceful shutdown
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true;
                Shutdown();
            };

            // Keep the main thread alive until dashboard exits or user closes the window
            dashboardProcess.WaitForExit();
            Shutdown();
        }

        static void Shutdown()
        {
            Console.WriteLine("\n[INFO] Shutting down services...");
            try
            {
                if (workerProcess != null && !workerProcess.HasExited)
                {
                    workerProcess.Kill();
                    Console.WriteLine("[OK] Worker stopped.");
                }
            }
            catch { }

            try
            {
                if (dashboardProcess != null && !dashboardProcess.HasExited)
                {
                    dashboardProcess.Kill();
                    Console.WriteLine("[OK] Dashboard stopped.");
                }
            }
            catch { }

            Environment.Exit(0);
        }
    }
}

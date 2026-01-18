package logger;

import logger.service.Logger;
import logger.pojo.Log;
import logger.enums.Severity;

public class TestDriver {
    public static void main(String[] args) throws InterruptedException {
        // 1. Initialize Logger with the User ID you just created
        String USER_ID = "da86dca2-b84c-4e99-9120-ee1bcdad348b";
        Logger logger = Logger.getInstance(USER_ID, "PaymentService");

        System.out.println("--- STARTING LOG INGESTION TEST ---");

        // 2. Simulate an Application Crash sequence
        // Log 1: Normal operation
        Log log1 = new Log();
        log1.setData("Payment gateway initialized successfully.");
        log1.setSeverity(Severity.LOW);
        logger.addLog(log1);

        // Log 2: The Warning
        Log log2 = new Log();
        log2.setData("Warning: High latency detected in DB connection pool.");
        log2.setSeverity(Severity.MEDIUM);
        logger.addLog(log2);

        // Log 3: The Critical Error (The one we want RAG to find!)
        Log log3 = new Log();
        log3.setData("CRITICAL: Connection Timeout. Failed to write transaction to table 'orders'. Thread-9 blocked.");
        log3.setSeverity(Severity.HIGH);
        logger.addLog(log3);

        // 3. Send the batch
        System.out.println("Buffering complete. Sending logs...");
        logger.appendLog();

        // 4. Wait a bit (since appendLog is async in background)
        Thread.sleep(2000);

        // 5. Cleanup
        logger.shutdown();
        System.out.println("--- TEST COMPLETE: Check Python Console ---");
    }
}

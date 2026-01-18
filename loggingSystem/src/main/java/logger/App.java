//package logger;
//
//
//import dev.langchain4j.data.segment.TextSegment;
//import dev.langchain4j.store.embedding.EmbeddingMatch;
//import logger.data.VectorStoreDatastore;
//import logger.enums.Severity;
//import logger.pojo.Log;
//import logger.service.LogAssistant;
//import logger.service.Logger;
//import queryProcessor.QueryProcessor;
//import queryProcessor.RAGqueryProcessor;
//
//
//import java.util.List;
//import java.util.concurrent.ExecutionException;
//import java.util.concurrent.Future;
//
///**
// * Hello world!
// */
//public class App {
//    public static void main(String[] args) throws InterruptedException{
//
//
//
//        Logger logger = Logger.getInstance();
//
//
//        logger.addLog(new Log("FATAL: Database connection timed out after 3 attempts", Severity.CRITICAL));
//        logger.addLog(new Log("WARN: Cache eviction policy is not optimal", Severity.WARN));
//        logger.addLog(new Log("ERROR: Null pointer exception at user processing service", Severity.HIGH));
//        logger.addLog(new Log("INFO: User 'admin' logged in successfully", Severity.LOW));
//        logger.addLog(new Log("ERROR: Failed to connect to the primary database server.", Severity.WARN));
//
//       Future<?> f1 =  logger.appendLog();
//
//
//        logger.addLog(new Log("This is log 6", Severity.WARN));
//        logger.addLog(new Log("This is log 7", Severity.LOW));
//        logger.addLog(new Log("This is log 8", Severity.MEDIUM));
//        logger.addLog(new Log("This is log 9", Severity.HIGH));
//        logger.addLog(new Log("This is log 10", Severity.CRITICAL));
//
//        Future<?> f2 = logger.appendLog();
//
//
//        try {
//            f1.get();
//            f2.get();
//        } catch (ExecutionException e) {
//            throw new RuntimeException(e);
//        }
//
//
//        QueryProcessor processor = new RAGqueryProcessor((VectorStoreDatastore) logger.getVectorStore());
//
//        LogAssistant assistant = new LogAssistant(processor);
//
//
//        String userQuery = "what went wrong with the database?";
//
//        System.out.println("\nSearching for logs related to: '" + userQuery + "'\n");
//        List<EmbeddingMatch<TextSegment>> relevantLogs = processor.process(userQuery);
//
//       String finalAnswer = assistant.answer(userQuery);
//
//        System.out.println("\n[Log Assistant's Answer]:\n" + finalAnswer);
//
////        // --- RESULTS ---
////        if (relevantLogs.isEmpty()) {
////            System.out.println("No relevant logs found.");
////        } else {
////            for (EmbeddingMatch<TextSegment> match : relevantLogs) {
////                System.out.printf("Match Score: %.2f%n", match.score());
////                System.out.println("Log Content: " + match.embedded().text());
////                System.out.println("Metadata: " + match.embedded().metadata());
////                System.out.println("--------------------");
////            }
////        }
//
//
//    }
//}

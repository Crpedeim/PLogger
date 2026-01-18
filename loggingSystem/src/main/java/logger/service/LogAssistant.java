package logger.service;



// Import the correct model class
import dev.langchain4j.model.mistralai.MistralAiChatModel;
import dev.langchain4j.data.segment.TextSegment;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import queryProcessor.QueryProcessor;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

public class LogAssistant {

    private final QueryProcessor queryProcessor;
    private final ChatLanguageModel chatModel;

    public LogAssistant(QueryProcessor queryProcessor) {
        this.queryProcessor = queryProcessor;


        this.chatModel = MistralAiChatModel.builder()
                .apiKey("q6PmLExnnomvEVBPx1qlLmot7o4oKNvc")
                .modelName("mistral-small-latest")
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    public String answer(String userQuery) {
        // Retrieve relevant logs
        List<EmbeddingMatch<TextSegment>> relevantLogs = queryProcessor.process(userQuery);

        if (relevantLogs.isEmpty()) {
            return "I couldn't find any logs related to your question.";
        }

        //  Create the context for the prompt
        String context = relevantLogs.stream()
                .map(match -> match.embedded().text())
                .collect(Collectors.joining("\n---\n"));

        // Create the final prompt
        String prompt = String.format(
                "You are a helpful assistant analyzing log files. " +
                        "Answer the user's question based ONLY on the following log entries.\n\n" +
                        "=== LOGS ===\n%s\n\n" +
                        "=== QUESTION ===\n%s",
                context,
                userQuery
        );

        // Step 4: Generate the answer
        return chatModel.generate(prompt);
    }
}

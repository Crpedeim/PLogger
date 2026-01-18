package logger.data;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import logger.pojo.Log;

import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

public class VectorStoreDatastore implements Datastore {

    private final EmbeddingStore<TextSegment> embeddingStore;
//    private final EmbeddingStoreIngestor ingestor;
    private final EmbeddingModel embeddingModel;

    public VectorStoreDatastore() {
        // 1. Define the Embedding Model (how to convert text to vectors)
        // Make sure your OPENAI_API_KEY environment variable is set!
        this.embeddingModel = new AllMiniLmL6V2EmbeddingModel();

        // 2. Define the Embedding Store (where to save the vectorized logs)
        // InMemoryEmbeddingStore is great for getting started. It's fast but not persistent.
        this.embeddingStore = new InMemoryEmbeddingStore<>();

        // 3. Create an Ingestor to simplify adding data to the store
//        this.ingestor = EmbeddingStoreIngestor.builder()
//                .embeddingStore(this.embeddingStore)
//                .embeddingModel(this.embeddingModel)
//                .build();
    }

    /**
     * Vectorizes a collection of logs and stores them.
     * This is the main method for your logger to call.
     */
    @Override
    public void appendLog(Collection<Log> logCollection) throws TimeoutException {
        if (logCollection == null || logCollection.isEmpty()) {
            return; // Nothing to do
        }

        // Step 1: Convert your Log objects into TextSegments
        List<TextSegment> segments = logCollection.stream()
                .map(this::logToTextSegment)
                .collect(Collectors.toList());

        // Step 2: Use the EmbeddingModel to create embeddings for all segments in a batch
        List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

        // Step 3: Add the embeddings and their corresponding segments directly to the store
        embeddingStore.addAll(embeddings, segments);

        System.out.println("✅ Ingested and stored " + segments.size() + " logs directly into the vector store.");
    }

    /**
     * Converts a single Log object into a TextSegment that LangChain4j can use.
     * The log message becomes the vectorizable text, and other fields become filterable metadata.
     */
    private TextSegment logToTextSegment(Log log) {
        // Create a rich text content for better semantic search
        String logContent = String.format("Severity: %s. Message: %s. StackTrace: %s",
                log.getSeverity(),
                log.getData(),
                log.getStackTrace() != null ? log.getStackTrace() : "None");

        // Store structured data as metadata for precise filtering later on
        Metadata metadata = new Metadata()
                .add("severity", log.getSeverity().name())
                .add("threadId", log.getThreadId())
                .add("threadName", log.getThreadName())
                .add("timestamp", log.getTimestamp().toInstant().toString()); // ISO-8601 format is standard

        return TextSegment.from(logContent, metadata);
    }

    @Override
    public void addLog(Log log) {
        TextSegment segment = logToTextSegment(log);

        // Step 2: Embed the single segment
        Embedding embedding = embeddingModel.embed(segment).content();

        // Step 3: Add the single embedding and segment to the store
        embeddingStore.add(embedding, segment);
    }

    /**
     * NOTE: InMemoryEmbeddingStore does not support deleting entries.
     * This method is a placeholder. For a real application, you would need
     * a vector database (like Chroma) that supports deletion.
     */
    @Override
    public void deleteLog() {
        System.err.println("WARNING: Deletion is not supported by InMemoryEmbeddingStore.");
        // In a real scenario with a proper DB, you'd implement deletion logic here,
        // e.g., deleting logs older than a certain date.
    }

    // Getter to allow the QueryProcessor to access the store
    public EmbeddingStore<TextSegment> getEmbeddingStore() {
        return this.embeddingStore;
    }

    // Getter to allow the QueryProcessor to use the same embedding model
    public EmbeddingModel getEmbeddingModel() {
        return this.embeddingModel;
    }
}

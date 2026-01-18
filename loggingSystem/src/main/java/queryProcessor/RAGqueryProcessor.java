package queryProcessor;

 // Use the same package

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import logger.data.VectorStoreDatastore;
import logger.enums.Severity;
import logger.pojo.Log;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/**
 * An implementation of QueryProcessor that uses a Retrieval-Augmented Generation (RAG)
 * approach by searching a vector store for semantically similar logs.
 */
public class RAGqueryProcessor implements QueryProcessor {

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;

    // You can make these configurable
    private static final int MAX_RESULTS_TO_RETRIEVE = 3;
    private static final double MINIMUM_SIMILARITY_SCORE = 0.6;

    public RAGqueryProcessor (VectorStoreDatastore datastore) {
        this.embeddingStore = datastore.getEmbeddingStore();
        this.embeddingModel = datastore.getEmbeddingModel();
    }

    @Override
    public List<EmbeddingMatch<TextSegment>> process(String query) {
        // Step 1: Convert the user's query string into a vector (embedding).
        Embedding queryEmbedding = embeddingModel.embed(query).content();

        // Step 2: Search the embedding store for the most similar vectors.
        return embeddingStore.findRelevant(
                queryEmbedding,
                MAX_RESULTS_TO_RETRIEVE,
                MINIMUM_SIMILARITY_SCORE
        );
    }



}

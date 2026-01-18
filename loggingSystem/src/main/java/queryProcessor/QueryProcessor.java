package queryProcessor; // Or your preferred package for querying

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingMatch;

import java.util.List;

/**
 * An interface for processing user queries against the log datastore.
 */
public interface QueryProcessor {

    /**
     * Processes a user's query and returns a list of relevant log matches.
     * @param query The natural language query from the user.
     * @return A list of {@link EmbeddingMatch} containing the most relevant logs.
     */
    List<EmbeddingMatch<TextSegment>> process(String query);
}
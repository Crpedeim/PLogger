package logger.data;

//// Handle server errors by retrying

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import logger.data.Datastore;
import logger.pojo.Log;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collection;
import java.util.concurrent.TimeoutException;

public class networkDataStore implements Datastore{

    private final String serverUrl;
    private final HttpClient httpClient;
    private final Gson gson;

    public networkDataStore(String serverUrl) {
        this.serverUrl = serverUrl; // e.g., "http://localhost:8000"

        // Optimize: Use a shared HttpClient instance
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)) // Don't hang forever if Python is down
                .build();

        // Setup GSON to handle your Timestamp fields gracefully
        this.gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }
    @Override
    public void addLog(Log log) {

    }

    @Override
    public void appendLog(Collection<Log> logCollection) throws TimeoutException {

        if (logCollection == null || logCollection.isEmpty()) {
            return;
        }

        try {
            // 1. Convert the Batch of Logs to JSON String
            String jsonPayload = gson.toJson(logCollection);

            // 2. Build the Request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(serverUrl + "/logs" +"/ingest")) // The Python endpoint
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            // 3. Send Request (Synchronous, because Logger runs this in a background thread)
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            // 4. Handle Response
            if (response.statusCode() != 200) {
                // If Python server rejects it (e.g., 500 error), you might want to throw
                // so the Logger can retry or log to a fallback file.
                System.err.println("Server returned error: " + response.body());
                throw new RuntimeException("Log ingestion failed with status: " + response.statusCode());
            }

        } catch (IOException | InterruptedException e) {
            // Restore interrupt status if interrupted
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            e.printStackTrace();
            // Depending on strictness, you might want to rethrow as RuntimeException
            // to signal the Logger that the batch failed.
        }

    }

    @Override
    public void deleteLog() {

    }
}

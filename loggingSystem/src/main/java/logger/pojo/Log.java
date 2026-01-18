package logger.pojo;

import logger.enums.Severity;

import java.io.Serial;
import java.io.Serializable;
import java.sql.Timestamp;

public class Log implements Serializable {
    @Serial
    private static final long serialVersionUID = 1234L;

    private String data;

    public Log(String data) {
        this.data = data;

    }
    public Log(){};

    public Log(String data, Severity severity){
        this.data = data;
        this.severity = severity;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }

    public String getThreadId() {
        return threadId;
    }

    public void setThreadId(String threadId) {
        this.threadId = threadId;
    }

    public String getThreadName() {
        return threadName;
    }

    public void setThreadName(String threadName) {
        this.threadName = threadName;
    }

    private Timestamp timestamp;

    private String threadId;

    private String threadName;

    private Severity severity;

    private String stackTrace;

    private String project_name;

    private String user_Id;

    public void setProject_name(String project_name) {
        this.project_name = project_name;
    }

    public void setUser_Id(String user_Id) {
        this.user_Id = user_Id;
    }

    public String getProject_name() {
        return project_name;
    }

    public String getUser_Id() {
        return user_Id;
    }

    public String getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(String stackTrace) {
        this.stackTrace = stackTrace;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }




}

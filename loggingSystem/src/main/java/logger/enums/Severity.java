package logger.enums;

import java.io.Serializable;

public enum Severity implements Serializable {
    UNDEFINED("undefined"),
    CRITICAL("critical"),
    HIGH("high"),
    MEDIUM("medium"),
    LOW("low"),
    WARN("warn");

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    private String name;

    Severity(String name){
        this.name = name;
    }

}

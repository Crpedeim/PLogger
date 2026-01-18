package logger.data;

import logger.pojo.Log;

import java.io.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.concurrent.TimeoutException;

public class FileStore implements Datastore{


    private long timestamp;
    private File file;
    private FileOutputStream fos;
    private ObjectOutputStream oos;

    public FileStore() {
        this.timestamp = java.time.Instant.now().getEpochSecond();
        this.file = new File("./logs/" + this.timestamp + ".log");
        try {
            this.fos = new FileOutputStream(file, true);
            this.oos = new ObjectOutputStream(this.fos);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void addLog(Log log){

    }

    @Override
    public void appendLog(Collection<Log> logCollection) throws TimeoutException {

        // here is where io will happen

            try {
                for(Log log: logCollection) {
                    System.out.println(log.toString());
                    this.oos.writeObject(log);
                }

            } catch (Exception e) {
                throw new RuntimeException(e);
            }


    }

    @Override
    public void  deleteLog(){
        // delete 30% logs form the file
        ArrayList<Log> logList = new ArrayList<>();
        File file = new File("log.txt");
        try{


            FileInputStream fis = new FileInputStream(file);

            ObjectInputStream ois = new ObjectInputStream(fis);


            while(true){
                try{
                    Log log = (Log) ois.readObject();

                    logList.add(log);

                }
                catch (EOFException ex){
                    System.out.println("ex");
                    break;
                }
                finally {
                    ois.close();
                    fis.close();
                }
            }

        }

        catch (Exception ex){
            ex.printStackTrace();
        }


        int slice = (int)(logList.size() * 0.3);


        ArrayList<Log> newLogList = new ArrayList<>(logList.subList(slice+1,logList.size()));

        try {
            appendLog(newLogList);
        }
        catch (Exception e){

        }

            System.out.println("Deleted 30% of older logs due to latency");



    }

    public void fileClose() throws IOException { // I KNOW THIS IS NOT CLOSED
        this.oos.flush();
        this.oos.close();
        this.fos.close();
    }



}

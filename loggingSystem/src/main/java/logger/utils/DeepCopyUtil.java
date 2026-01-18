package logger.utils;

import java.io.*;

public class DeepCopyUtil {

    // Object Stream --> Byte Stream
    // Byte Stream --> Object Stream
    // Object Stream --> Object

    public static <T> T deepCopy( T original ){


        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutputStream oos = new ObjectOutputStream(bos);

            oos.writeObject(original);
            oos.flush();

            ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());

            ObjectInputStream ois = new ObjectInputStream(bis);

           T copy = (T) ois.readObject();

           bos.close();
           oos.close();
           bis.close();
           ois.close();

           return copy;


        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException(e);
        }

    }


}

package net.uaznia.lukanus.hudson.plugins.gitparameter;


import java.io.Serializable;
import java.util.Comparator;

public class MySmartComparer implements Comparator<String>, Serializable {
    @Override
    public int compare(String a, String b) {
        if (a != null && b != null) {
            if (a.startsWith("origin/dev_") || b.startsWith("origin/dev_")) {
                if (a.startsWith("origin/dev_") && b.startsWith("origin/dev_")) {
                    return b.compareTo(a);
                } else if (a.startsWith("origin/dev_")) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (a.startsWith("origin/release") || b.startsWith("origin/release")) {
                if (a.startsWith("origin/release")) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (a.startsWith("origin/master") || b.startsWith("origin/master")) {
                if (a.startsWith("origin/master")) {
                    return -1;
                } else {
                    return 1;
                }
            }else{
                return b.compareTo(a);
            }
        }
        return 0;
    }
}

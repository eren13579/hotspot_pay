package com.hotspotpay.common.util;

/**
 * Utilitaires de formatage de durées.
 *
 * Deux formats :
 * - Human-readable : "1h", "2h 30min", "1 jour(s)", "2 semaine(s)"
 * - MikroTik     : "1h", "4w2d", "30m" (format time-limit RouterOS)
 */
public final class DurationUtils {

    private DurationUtils() {
        // utility class
    }

    /**
     * Format human-readable en français.
     * Ex: 60 → "1h", 150 → "2h 30min", 1440 → "1 jour(s)", 10080 → "1 semaine(s)"
     */
    public static String formatHumanReadable(int totalMinutes) {
        if (totalMinutes <= 0) return "0 min";
        if (totalMinutes < 60) return totalMinutes + " min";
        if (totalMinutes < 1440) {
            int hours = totalMinutes / 60;
            int min = totalMinutes % 60;
            return min > 0 ? hours + "h " + min + "min" : hours + "h";
        }
        if (totalMinutes < 10080) {
            int days = totalMinutes / 1440;
            return days + " jour(s)";
        }
        int weeks = totalMinutes / 10080;
        return weeks + " semaine(s)";
    }

    /**
     * Format MikroTik time-limit (RouterOS).
     * Ex: 60 → "1h", 1440 → "1d", 10080 → "1w", 20160 → "2w"
     * Ex: 150 → "2h30m", 1500 → "1d1h"
     */
    public static String formatMikroTik(int totalMinutes) {
        if (totalMinutes <= 0) return null;
        int minutes = totalMinutes % 60;
        int hours = (totalMinutes / 60) % 24;
        int days = (totalMinutes / 1440) % 7;
        int weeks = totalMinutes / 10080;

        StringBuilder sb = new StringBuilder();
        if (weeks > 0) sb.append(weeks).append("w");
        if (days > 0) sb.append(days).append("d");
        if (hours > 0) sb.append(hours).append("h");
        if (minutes > 0) sb.append(minutes).append("m");
        return sb.length() > 0 ? sb.toString() : null;
    }
}

import Typography from '@/components/ui/typography/typography';
import { useTheme } from '@/providers/theme-provider';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AnalyticsEvent {
  id: string;
  eventName: string;
  parameters: Record<string, any>;
  timestamp: string;
}

/**
 * Analytics Event Logger Component
 * Shows all Firebase Analytics events in real-time
 */
const AnalyticsEventLogger = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    // Override console.log to capture analytics events
    const originalLog = console.log;

    console.log = (...args: any[]) => {
      // Check if this is a Firebase Analytics event log
      if (args[0] && typeof args[0] === 'string' && args[0].includes('🔥 Firebase Analytics Event:')) {
        const eventName = args[0].replace('🔥 Firebase Analytics Event: ', '');
        const parameters = args[1] || {};

        const newEvent: AnalyticsEvent = {
          id: Date.now().toString(),
          eventName,
          parameters,
          timestamp: new Date().toISOString(),
        };

        setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
      }

      // Call original console.log
      originalLog.apply(console, args);
    };

    // Cleanup
    return () => {
      console.log = originalLog;
    };
  }, []);

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="text" size="lg" weight="bold" style={styles.title}>
          📊 Analytics Events Logger
        </Typography>
        <Typography variant="text" size="xs" style={styles.count}>
          {events.length} events
        </Typography>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {events.length === 0 ? (
          <Typography variant="text" size="md" style={styles.emptyText}>
            No events logged yet. Trigger some analytics events to see them here.
          </Typography>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <Typography variant="text" size="md" weight="bold" style={styles.eventName}>
                {event.eventName}
              </Typography>
              <Typography variant="text" size="xs" style={styles.timestamp}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </Typography>
              {Object.keys(event.parameters).length > 0 && (
                <Typography variant="text" size="xs" style={styles.parameters}>
                  {JSON.stringify(event.parameters, null, 2)}
                </Typography>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {events.length > 0 && (
        <View style={styles.footer}>
          <Typography
            variant="text"
            size="xs"
            style={styles.clearButton}
            onPress={clearEvents}
          >
            Clear Events
          </Typography>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.radius.md,
      margin: theme.spacing(2),
      maxHeight: 300,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing(3),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.primary,
    },
    title: {
      color: theme.colors.foreground.brand_primary,
    },
    count: {
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.tertiary,
      paddingHorizontal: theme.spacing(2),
      paddingVertical: theme.spacing(1),
      borderRadius: theme.radius.sm,
    },
    scrollView: {
      maxHeight: 200,
    },
    eventItem: {
      padding: theme.spacing(2),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.primary,
    },
    eventName: {
      color: theme.colors.foreground.brand_primary,
      marginBottom: theme.spacing(1),
    },
    timestamp: {
      color: theme.colors.text.tertiary,
      marginBottom: theme.spacing(1),
    },
    parameters: {
      color: theme.colors.text.secondary,
      fontFamily: 'monospace',
      backgroundColor: theme.colors.background.quaternary,
      padding: theme.spacing(1),
      borderRadius: theme.radius.sm,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.text.tertiary,
      padding: theme.spacing(4),
      fontStyle: 'italic',
    },
    footer: {
      padding: theme.spacing(2),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.primary,
    },
    clearButton: {
      color: theme.colors.foreground.error_primary,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
  });

export default AnalyticsEventLogger;

import { View, Text, Pressable, StyleSheet } from "react-native";
import type { AgendaReadModel } from "../lib/agenda/agendaTypes";
import { buildCalendarCells } from "../lib/agenda/agendaCalendar";
import { formatAgendaTime } from "../lib/agenda/agendaPresentation";
import { authorizeAgendaPresentation, type PresentationViewer } from "../lib/security/presentationSecurity";

type AgendaCalendarProps = {
  model: AgendaReadModel;
  monthKey: string;
  onSelectDay?: (dateKey: string) => void;
  viewer?: PresentationViewer;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AgendaCalendar({ model, monthKey, onSelectDay, viewer }: AgendaCalendarProps) {
  const cells = buildCalendarCells(model, monthKey);

  return (
    <View accessibilityRole="grid">
      <View style={styles.weekHeader}>
        {WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => {
          const visibleItems = cell.day?.items.filter((item) =>
            viewer ? authorizeAgendaPresentation(viewer, item).canView : true,
          ) ?? [];

          return (
            <Pressable
              key={cell.dateKey}
              accessibilityRole="button"
              accessibilityLabel={`${cell.dateKey}, ${visibleItems.length} consultations`}
              disabled={!cell.isCurrentMonth}
              onPress={() => onSelectDay?.(cell.dateKey)}
              style={[styles.cell, !cell.isCurrentMonth && styles.outsideMonth]}
            >
              <Text style={[styles.dayNumber, !cell.isCurrentMonth && styles.muted]}>{cell.dayNumber}</Text>
              {visibleItems.slice(0, 3).map((item) => (
                <Text key={item.bookingId} numberOfLines={1} style={styles.item}>
                  {formatAgendaTime(item.startsAtUtc, model.timezone)} {item.subject}
                </Text>
              ))}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekHeader: { flexDirection: "row" },
  weekday: { flex: 1, paddingVertical: 8, textAlign: "center", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "14.2857%", minHeight: 88, padding: 6, borderWidth: StyleSheet.hairlineWidth },
  outsideMonth: { opacity: 0.45 },
  dayNumber: { fontWeight: "700", marginBottom: 4 },
  muted: { opacity: 0.55 },
  item: { fontSize: 11, marginTop: 2 },
});

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { colors, spacing, text } from "../../src/theme";

export default function Journal() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.journal();
      setItems(r.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={text.label}>JOURNAL</Text>
        <Text style={[text.h2, { marginTop: spacing.xs }]}>The receipts.</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: spacing.xl }} />
      ) : items.length === 0 ? (
        <View style={s.empty}>
          <Text style={[text.bodyDim, { textAlign: "center" }]}>
            Nothing here yet. Draw a card.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={colors.textPrimary}
            />
          }
          ItemSeparatorComponent={() => <View style={s.divider} />}
          renderItem={({ item }) => (
            <View testID={`journal-item-${item.id}`} style={s.row}>
              <View style={s.rowHead}>
                <Text style={text.label}>
                  {(item.kind || "draw").toUpperCase()} · {item.date}
                </Text>
              </View>
              <Text style={[text.h3, { marginTop: spacing.sm }]}>
                {item.card_name}
                {item.reversed ? " · Reversed" : ""}
              </Text>
              {item.question ? (
                <Text style={[text.bodyDim, { marginTop: spacing.sm, fontStyle: "italic" }]}>
                  &quot;{item.question}&quot;
                </Text>
              ) : null}
              <Text style={[text.body, { marginTop: spacing.sm, color: colors.textSecondary }]}>
                {item.interpretation}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  empty: { padding: spacing.xl, marginTop: spacing.xl },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: 4 },
  rowHead: { flexDirection: "row", justifyContent: "space-between" },
});

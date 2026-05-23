import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { colors, spacing, text } from "../../src/theme";

type Friend = { id: string; username: string; compat_score: number | null };

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [uname, setUname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [compatDetail, setCompatDetail] = useState<any>(null);
  const [computing, setComputing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.friends();
      setFriends(r.items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addFriend = async () => {
    setError(null);
    setAdding(true);
    try {
      await api.addFriend(uname.trim());
      setUname("");
      setShowAdd(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const computeCompat = async (f: Friend) => {
    setComputing(f.id);
    try {
      const r = await api.compatibility(f.id);
      setCompatDetail({ ...r, friend_username: f.username });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setComputing(null);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View>
          <Text style={text.label}>FRIENDS</Text>
          <Text style={[text.h2, { marginTop: spacing.xs }]}>Match maps.</Text>
        </View>
        <TouchableOpacity
          testID="friends-add-btn"
          style={s.addBtn}
          onPress={() => setShowAdd(true)}
        >
          <Text style={s.addBtnText}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.textPrimary} />
      ) : friends.length === 0 ? (
        <View style={s.empty}>
          <Text style={[text.bodyDim, { textAlign: "center" }]}>
            No one. Yet. Add someone by username.
          </Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(f) => f.id}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`friend-row-${item.username}`}
              style={s.row}
              onPress={() => computeCompat(item)}
              disabled={computing === item.id}
            >
              <View style={{ flex: 1 }}>
                <Text style={text.bodyLg}>@{item.username}</Text>
                <Text style={text.bodyDim}>
                  {item.compat_score !== null
                    ? `Compatibility: ${item.compat_score}%`
                    : "Tap to compute"}
                </Text>
              </View>
              {computing === item.id ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={[text.label, { color: colors.textPrimary }]}>
                  {item.compat_score !== null ? "VIEW →" : "RUN →"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" transparent={false}>
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
          <View style={s.modalContent}>
            <View style={s.modalHead}>
              <Text style={text.h3}>Add friend</Text>
              <Pressable testID="friends-add-close" onPress={() => setShowAdd(false)} hitSlop={12}>
                <Text style={[text.label, { color: colors.textPrimary }]}>CLOSE ×</Text>
              </Pressable>
            </View>
            <Text style={[text.bodyDim, { marginVertical: spacing.md }]}>
              Their username. They must be onboarded.
            </Text>
            <TextInput
              testID="friends-add-input"
              value={uname}
              onChangeText={setUname}
              placeholder="username"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              style={s.input}
            />
            {error ? (
              <Text testID="friends-add-error" style={s.error}>
                {error}
              </Text>
            ) : null}
            <TouchableOpacity
              testID="friends-add-submit"
              style={[s.primaryBtn, adding && { opacity: 0.6 }]}
              onPress={addFriend}
              disabled={adding || !uname.trim()}
            >
              <Text style={s.primaryBtnText}>{adding ? "ADDING..." : "ADD"}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!compatDetail} animationType="slide" transparent={false}>
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
          <View style={s.modalContent}>
            <View style={s.modalHead}>
              <Text style={text.label}>COMPATIBILITY</Text>
              <Pressable
                testID="friends-compat-close"
                onPress={() => setCompatDetail(null)}
                hitSlop={12}
              >
                <Text style={[text.label, { color: colors.textPrimary }]}>CLOSE ×</Text>
              </Pressable>
            </View>
            {compatDetail && (
              <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.lg }}>
                <Text style={[text.h3, { textAlign: "center" }]}>
                  You & @{compatDetail.friend_username}
                </Text>
                <Text style={s.bigScore}>{compatDetail.score}%</Text>
                <Text testID="friends-compat-reading" style={[text.bodyLg, s.compatReading]}>
                  {compatDetail.reading}
                </Text>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: {
    color: colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 2,
  },
  empty: { padding: spacing.xl, marginTop: spacing.xl },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  row: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  modalContent: { flex: 1, padding: spacing.lg },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: "Inter_400Regular",
  },
  error: { color: colors.error, marginTop: spacing.md, fontFamily: "Inter_500Medium" },
  primaryBtn: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  bigScore: {
    fontFamily: "CormorantGaramond_300Light",
    fontSize: 120,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 130,
  },
  compatReading: { lineHeight: 28, color: colors.textPrimary, paddingHorizontal: spacing.md },
});

import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.logo}>
        <Text style={styles.logoText}>م</Text>
      </View>
      <Text style={styles.title}>مستشارك</Text>
      <Text style={styles.subtitle}>استشارتك القانونية تبدأ من هنا</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>نسخة الهاتف جاهزة للتجربة</Text>
        <Text style={styles.cardText}>
          تم تجهيز تطبيق Expo داخل مستودع GitHub. سنربطه الآن بالواجهات والخدمات الحالية خطوة بخطوة.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F7F9FC",
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#102A43",
    marginBottom: 18,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#102A43",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#52606D",
    textAlign: "center",
    marginBottom: 28,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#102A43",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#102A43",
    marginBottom: 8,
    textAlign: "right",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 23,
    color: "#627D98",
    textAlign: "right",
  },
});

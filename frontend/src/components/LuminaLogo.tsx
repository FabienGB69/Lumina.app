import React from "react";
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const LOGO = require("../../assets/images/icon.png");

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  glow?: boolean;
};

export function LuminaLogo({ size = 96, style, imageStyle, glow = true }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.24 },
        glow && styles.glow,
        style,
      ]}
    >
      <Image
        source={LOGO}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size * 0.24,
          },
          imageStyle,
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignSelf: "center",
  },
  glow: {
    // Golden halo — subtle on both platforms
    shadowColor: "#F0C560",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
});

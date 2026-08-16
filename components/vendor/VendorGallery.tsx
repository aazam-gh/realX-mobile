import Ionicons from "@expo/vector-icons/Ionicons";
import {
  PagerView,
  type PagerViewRef,
} from "@expo/ui/community/pager-view";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Typography } from "../../constants/Typography";
import { useAppTheme } from "../../context/AppThemeContext";
import { RemoteImage } from "../RemoteImage";

type VendorGalleryProps = {
  images?: unknown;
  isArabic: boolean;
};

const GALLERY_LIMIT = 12;
const THUMBNAIL_SIZE = 64;

export function VendorGallery({ images, isArabic }: VendorGalleryProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const inlinePagerRef = useRef<PagerViewRef>(null);
  const viewerPagerRef = useRef<PagerViewRef>(null);
  const prefetchedGalleryRef = useRef("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const galleryImages = useMemo(
    () =>
      Array.isArray(images)
        ? images
            .filter(
              (imageUrl): imageUrl is string =>
                typeof imageUrl === "string" && imageUrl.trim().length > 0,
            )
            .slice(0, GALLERY_LIMIT)
        : [],
    [images],
  );

  useEffect(() => {
    setActiveIndex(0);
    inlinePagerRef.current?.setPageWithoutAnimation(0);
  }, [galleryImages]);

  useEffect(() => {
    if (selectedIndex == null) return;
    const galleryKey = galleryImages.join("|");
    if (prefetchedGalleryRef.current === galleryKey) return;

    prefetchedGalleryRef.current = galleryKey;
    void Image.prefetch(galleryImages, "memory-disk");
  }, [galleryImages, selectedIndex]);

  if (galleryImages.length === 0) return null;

  const openViewer = (index: number) => {
    setActiveIndex(index);
    setSelectedIndex(index);
  };

  const selectInlineImage = (index: number) => {
    setActiveIndex(index);
    inlinePagerRef.current?.setPage(index);
  };

  const selectViewerImage = (index: number) => {
    setSelectedIndex(index);
    setActiveIndex(index);
    inlinePagerRef.current?.setPageWithoutAnimation(index);
    viewerPagerRef.current?.setPage(index);
  };

  const handleViewerPageSelected = (index: number) => {
    setSelectedIndex(index);
    setActiveIndex(index);
    inlinePagerRef.current?.setPageWithoutAnimation(index);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headingRow, isArabic && styles.rowReverse]}>
        <Text
          style={[
            styles.heading,
            {
              color: theme.text,
              textAlign: isArabic ? "right" : "left",
              writingDirection: isArabic ? "rtl" : "ltr",
            },
          ]}
        >
          {t("gallery")}
        </Text>
        <Text style={[styles.count, { color: theme.subtleText }]}>
          {galleryImages.length}
        </Text>
      </View>

      <View
        style={[
          styles.featuredFrame,
          { backgroundColor: theme.cardMuted, borderColor: theme.border },
        ]}
      >
        <PagerView
          ref={inlinePagerRef}
          style={styles.pager}
          initialPage={0}
          layoutDirection={isArabic ? "rtl" : "ltr"}
          offscreenPageLimit={1}
          onPageSelected={(event) => setActiveIndex(event.nativeEvent.position)}
        >
          {galleryImages.map((imageUrl, index) => (
            <Pressable
              key={`${imageUrl}-${index}`}
              style={styles.page}
              onPress={() => openViewer(index)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`${t("gallery")} ${index + 1} / ${galleryImages.length}`}
            >
              <RemoteImage
                source={{ uri: imageUrl }}
                style={styles.featuredImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority={index === activeIndex ? "high" : "normal"}
                transition={150}
              />
            </Pressable>
          ))}
        </PagerView>

        <View
          pointerEvents="none"
          style={[styles.imageCounter, { backgroundColor: theme.card }]}
        >
          <Ionicons name="images-outline" size={14} color={theme.text} />
          <Text style={[styles.imageCounterText, { color: theme.text }]}>
            {activeIndex + 1} / {galleryImages.length}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.thumbnailList,
          isArabic && styles.rowReverse,
        ]}
      >
        {galleryImages.map((imageUrl, index) => {
          const isSelected = index === activeIndex;
          return (
            <Pressable
              key={`${imageUrl}-thumbnail-${index}`}
              onPress={() => selectInlineImage(index)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${t("gallery")} ${index + 1} / ${galleryImages.length}`}
              style={({ pressed }) => [
                styles.thumbnailButton,
                {
                  borderColor: isSelected ? theme.brand : theme.border,
                  opacity: pressed ? 0.72 : isSelected ? 1 : 0.68,
                },
              ]}
            >
              <RemoteImage
                source={{ uri: imageUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedIndex != null && (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setSelectedIndex(null)}
        >
          <View
            accessibilityViewIsModal
            style={[styles.viewerScreen, { backgroundColor: theme.background }]}
          >
            <View
              style={[
                styles.viewerHeader,
                {
                  paddingTop: insets.top + 8,
                  borderBottomColor: theme.border,
                },
                isArabic && styles.rowReverse,
              ]}
            >
              <Pressable
                onPress={() => setSelectedIndex(null)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t("close_gallery")}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.cardMuted, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>

              <Text style={[styles.viewerTitle, { color: theme.text }]}>
                {t("gallery")}
              </Text>

              <View style={[styles.viewerCount, { backgroundColor: theme.cardMuted }]}>
                <Text style={[styles.viewerCountText, { color: theme.text }]}>
                  {selectedIndex + 1} / {galleryImages.length}
                </Text>
              </View>
            </View>

            <PagerView
              ref={viewerPagerRef}
              style={styles.viewerPager}
              initialPage={selectedIndex}
              layoutDirection={isArabic ? "rtl" : "ltr"}
              offscreenPageLimit={1}
              onPageSelected={(event) =>
                handleViewerPageSelected(event.nativeEvent.position)
              }
            >
              {galleryImages.map((imageUrl, index) => (
                <View key={`${imageUrl}-viewer-${index}`} style={styles.viewerPage}>
                  <RemoteImage
                    source={{ uri: imageUrl }}
                    style={styles.fullImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    priority={index === selectedIndex ? "high" : "normal"}
                    transition={150}
                  />
                </View>
              ))}
            </PagerView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.viewerThumbnailRail, { borderTopColor: theme.border }]}
              contentContainerStyle={[
                styles.viewerThumbnailList,
                { paddingBottom: Math.max(insets.bottom, 12) },
                isArabic && styles.rowReverse,
              ]}
            >
              {galleryImages.map((imageUrl, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <Pressable
                    key={`${imageUrl}-viewer-thumbnail-${index}`}
                    onPress={() => selectViewerImage(index)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${t("gallery")} ${index + 1} / ${galleryImages.length}`}
                    style={({ pressed }) => [
                      styles.viewerThumbnailButton,
                      {
                        borderColor: isSelected ? theme.brand : "transparent",
                        opacity: pressed ? 0.72 : isSelected ? 1 : 0.6,
                      },
                    ]}
                  >
                    <RemoteImage
                      source={{ uri: imageUrl }}
                      style={styles.thumbnail}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    gap: 12,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  heading: {
    ...Typography.getTextVariantStyle("bodyStrong"),
    fontSize: 14,
    letterSpacing: 0.8,
  },
  count: {
    ...Typography.getTextVariantStyle("body"),
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  featuredFrame: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 22,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  imageCounter: {
    position: "absolute",
    right: 12,
    bottom: 12,
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  imageCounterText: {
    ...Typography.getTextVariantStyle("bodyStrong"),
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  thumbnailList: {
    gap: 8,
    paddingRight: 20,
  },
  thumbnailButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    overflow: "hidden",
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 2,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  viewerScreen: {
    flex: 1,
  },
  viewerHeader: {
    minHeight: 62,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerTitle: {
    ...Typography.getTextVariantStyle("bodyStrong"),
    fontSize: 16,
  },
  viewerCount: {
    minWidth: 54,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCountText: {
    ...Typography.getTextVariantStyle("bodyStrong"),
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  viewerPager: {
    flex: 1,
  },
  viewerPage: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  fullImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    borderCurve: "continuous",
  },
  viewerThumbnailRail: {
    flexGrow: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewerThumbnailList: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  viewerThumbnailButton: {
    width: 58,
    height: 58,
    borderRadius: 11,
    borderCurve: "continuous",
    borderWidth: 2,
    overflow: "hidden",
  },
});

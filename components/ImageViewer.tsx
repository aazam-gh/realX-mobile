import { ImageSourcePropType, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';

type Props = {
  imgSource: ImageSourcePropType;
};

export default function ImageViewer({ imgSource }: Props) {
  const { width, height } = useWindowDimensions();
  const imageWidth = Math.min(320, width - 40);
  const imageHeight = Math.min(440, height * 0.55);

  return <Image source={imgSource} style={[styles.image, { width: imageWidth, height: imageHeight }]} />;
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 18,
  },
});

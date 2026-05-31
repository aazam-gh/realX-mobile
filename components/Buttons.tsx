import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Typography } from '../constants/Typography';

type Props = {
  label: string;
};

export default function Button({ label }: Props) {
  const { width } = useWindowDimensions();
  const buttonWidth = Math.min(320, width - 40);

  return (
    <View style={[styles.buttonContainer, { width: buttonWidth }]}>
      <Pressable style={styles.button} onPress={() => alert('You pressed a button.')}>
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    height: 68,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Typography.poppins.semiBold,
  },
});

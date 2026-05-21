import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Props = {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onSubmit?: () => void;
    onClear?: () => void;
};

export default function SearchBar({ placeholder = 'Search for anything...', value, onChangeText, onSubmit, onClear }: Props) {
    const navigation = useNavigation();

    useEffect(() => {
        if (!onChangeText) return;

        const unsubscribe = navigation.addListener('blur', () => {
            onChangeText('');
        });

        return unsubscribe;
    }, [navigation, onChangeText]);

    const handleClear = () => {
        if (onClear) {
            onClear();
            return;
        }

        onChangeText?.('');
    };

    return (
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.brandGreen} style={styles.icon} />
            <TextInput
                style={[styles.input, { color: Colors.light.text }]}
                placeholder={placeholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                value={value}
                onChangeText={onChangeText}
                returnKeyType="search"
                onSubmitEditing={onSubmit}
            />
            {(value?.length ?? 0) > 0 ? (
                <TouchableOpacity
                    onPress={handleClear}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    hitSlop={8}
                >
                    <Ionicons name="close-circle" size={18} color={Colors.light.tabIconDefault} />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginHorizontal:20,
        marginVertical:12
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: Typography.poppins.medium,
        padding: 0,
    },
});

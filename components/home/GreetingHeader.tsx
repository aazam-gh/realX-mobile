import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MascotThemeButton from './MascotThemeButton';
import SearchBar from './SearchBar';
import { HOME_HORIZONTAL_GUTTER } from './layout';

type Props = {
    userName: string;
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onSearchSubmit: () => void;
};

export default function GreetingHeader({ userName, searchQuery, onSearchChange, onSearchSubmit }: Props) {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <SearchBar
                compact
                placeholder={t('home_search_placeholder', { name: userName })}
                value={searchQuery}
                onChangeText={onSearchChange}
                onSubmit={onSearchSubmit}
            />
            <MascotThemeButton />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: HOME_HORIZONTAL_GUTTER,
        gap: 12,
    },
});

import { FlatList, StyleSheet, Text, View } from 'react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { fonts } from '../constants/fonts';
import { ActivityIndicator, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { ListItem, SearchBar } from '@rneui/themed';
import { getFirestore } from '@react-native-firebase/firestore';

// Memoized AgentsItem Component
const AgentsItem = memo(({ item, onPress }) => (
  <ListItem containerStyle={styles.listItemContainer} onPress={onPress}>
    <ListItem.Content>
      <View style={styles.agentNameRow}>
        <ListItem.Title style={styles.agentNameLabel}>Agent Name:</ListItem.Title>
        <ListItem.Title style={styles.agentNameValue}>{item.AgentName}</ListItem.Title>
      </View>
      <View style={styles.agentIdRow}>
        <ListItem.Subtitle style={styles.agentIdLabel}>Agent ID:</ListItem.Subtitle>
        <ListItem.Subtitle style={styles.agentIdValue}>{item.AgentID}</ListItem.Subtitle>
      </View>
    </ListItem.Content>
    <ListItem.Chevron color={colors.black} />
  </ListItem>
));

const AssignScreen = () => {
  const navigation = useNavigation();
  const [fetchAgentLoader, setFetchAgentLoader] = useState(false);
  const [agentsList, setAgentsList] = useState([]);

  const fetchAgentLists = useCallback(async () => {
    setFetchAgentLoader(true);
    try {
      const agentsSnap = await getFirestore().collection('agents').get();
      const agentsData = agentsSnap.docs.map(doc => doc.data());
      console.log('agentsData: ', agentsData);
      setAgentsList(agentsData);
    } catch (error) {
      console.log('Error in internal server while fetching agents', error);
    } finally {
      setFetchAgentLoader(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentLists();
  }, [fetchAgentLists]);

  const handlePress = useCallback(
    item => {
      navigation.navigate('AssignViewScreen', { data: item.item });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }) => <AgentsItem item={item} onPress={() => handlePress({ item })} />,
    [handlePress],
  );

  const keyExtractor = useCallback(item => item.AgentID.toString(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const filterAgent = agentsList.filter(
    item =>
      item.AgentName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.AgentID.toString().includes(searchQuery.toString()),
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.pureWhite} />
        <Appbar.Content
          title="Assign Agents"
          color={colors.pureWhite}
          titleStyle={styles.headerText}
        />
      </Appbar.Header>

      {fetchAgentLoader ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" animating={true} />
        </View>
      ) : (
        <>
          <SearchBar
            autoCorrect={false}
            value={searchQuery}
            onChangeText={text => setSearchQuery(text)}
            placeholder="Search Agent"
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchBarInputContainer}
            leftIconContainerStyle={styles.searchBarLeftIcon}
            rightIconContainerStyle={styles.searchBarRightIcon}
            inputStyle={styles.searchBarInput}
          />

          <FlatList
            data={searchQuery.trim() ? filterAgent : agentsList}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        </>
      )}
    </View>
  );
};

export default AssignScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.halfWhite,
    flex: 1,
  },
  headerContainer: {
    backgroundColor: colors.orange,
    height: dimensions.xl * 2.25,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontFamily: fonts.bold,
    fontSize: dimensions.sm * 1.5,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  searchBarContainer: {
    backgroundColor: colors.halfWhite,
    borderColor: colors.halfWhite,
  },
  searchBarInputContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.xl,
    padding: 0,
    height: dimensions.xl * 1.3,
  },
  searchBarLeftIcon: {
    marginLeft: dimensions.md,
  },
  searchBarRightIcon: {
    marginRight: dimensions.sm,
  },
  searchBarInput: {
    fontSize: dimensions.sm * 1.15,
  },
  listItemContainer: {
    marginHorizontal: dimensions.sm,
    borderColor: colors.lightGray,
    borderWidth: 1,
    borderRadius: dimensions.sm,
    marginVertical: dimensions.sm / 3,
  },
  agentNameRow: {
    flexDirection: 'row',
    gap: dimensions.sm,
  },
  agentNameLabel: {
    fontFamily: fonts.medium,
  },
  agentNameValue: {
    fontFamily: fonts.bold,
  },
  agentIdRow: {
    flexDirection: 'row',
    gap: dimensions.sm,
  },
  agentIdLabel: {
    fontFamily: fonts.medium,
  },
  agentIdValue: {
    fontFamily: fonts.bold,
  },
});
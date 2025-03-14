import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {getFirestore} from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';

const ViewReports = () => {
  const navigation = useNavigation();
  // Sample state for pending orders
  const [pendingOrders, setPendingOrders] = useState([]);
  console.log('pendingOrders: ', pendingOrders);
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const data = await (
          await getFirestore().collection('orders').get()
        ).docs;
        const mapData = data.map(doc => ({
          data: doc.data(),
        }));
        setPendingOrders(mapData);
      } catch (error) {
        console.log('Error in fetching pending orders');
      }
    };
    fetchPendingOrders();
  }, []);

  // Render item function for FlatList

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingOrders}
        renderItem={({item}) => {
          console.log(item);
          return (
            <TouchableOpacity
              style={styles.cartItem}
              onPress={() =>
                navigation.navigate('PendingOrders', {
                  item: item.data.OrdersPending,
                })
              }>
              <Text>Agent Name:{item.data.AgentName}</Text>
              <Text>Agent Id:{item.data.AgentID}</Text>
              <Text>Agent Number:{item.data.MobileNumber}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  item: {
    backgroundColor: colors.grayText,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  cartItem: {
    alignItems: 'flex-start',
    backgroundColor: colors.pureWhite,
    padding: dimensions.sm,
    borderRadius: dimensions.sm,
    marginBottom: dimensions.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default ViewReports;

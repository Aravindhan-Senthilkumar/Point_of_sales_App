import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {getFirestore} from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import { Appbar, Card } from 'react-native-paper';
import { fonts } from '../constants/fonts';
import { ListItem } from '@rneui/themed';


const ViewReports = () => {
  const navigation = useNavigation();
  // Sample state for pending orders
  const [pendingOrders, setPendingOrders] = useState([]);
  console.log('pendingOrders: ', pendingOrders);
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const data = await (
          await getFirestore().collection('products').get()
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
  const [expanded, setExpanded] = useState(false);
  return (
    <View>
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Reports"
          color={colors.pureWhite}
          titleStyle={styles.headerText}
        />
      </Appbar.Header>
      {/* <FlatList
        data={pendingOrders}
        renderItem={({item}) => {
          console.log(item);
          return (
            <View style={{ marginHorizontal:dimensions.sm / 2 }}>
                    <Card contentStyle={{ backgroundColor:colors.pureWhite,paddingHorizontal:dimensions.md,borderRadius:dimensions.sm }} mode="elevated" style={styles.cardContainer} onPress={() => navigation.navigate('StockListingScreen', { item })}>
                    <View style={{flexDirection: 'row'}}>
                      <Card.Cover
                        source={{uri: item.data.ProductImage}}
                        style={styles.CardImage}
                        />
                      <View style={{justifyContent:'center'}}>
                        <Card.Content>
                          <View
                            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={{ flexDirection:'row', justifyContent:'space-between',alignItems:'center',width:'85%'}}>
                            <Text style={{ fontFamily:fonts.regular }}>Product Id: <Text style={{ fontFamily:fonts.semibold }}> {item.data.ProductId}</Text></Text>
                            </View>
                          </View>
                          <Text style={{ fontFamily:fonts.regular }}>Product Name: <Text style={{ fontFamily:fonts.semibold }}> {item.data.ProductName}</Text></Text>
                          <Text style={{ fontFamily:fonts.regular }}>Brand: <Text style={{ fontFamily:fonts.semibold }}> {item.data.BrandName}</Text></Text>
                          <Text style={{ fontFamily:fonts.regular }}>Category: <Text style={{ fontFamily:fonts.semibold }}> {item.data.Category}</Text></Text>
                        </Card.Content>
                      </View>
                    </View>
                  </Card>
                  </View>
          );
        }}
      /> */}
      <ListItem.Accordion
      containerStyle={{ marginVertical:dimensions.sm,marginHorizontal:dimensions.sm/2,borderRadius:dimensions.sm }} 
      isExpanded={expanded}
      onPress={() => setExpanded(!expanded)}
      content={(
          <ListItem.Content selectable={true} selectionColor={colors.darkblue}>
          <ListItem.Title style={{ fontFamily:fonts.bold }}>Date </ListItem.Title>
          <ListItem.Subtitle style={{ fontFamily:fonts.regular}}>Sold stocks</ListItem.Subtitle>
          <ListItem.Subtitle style={{ fontFamily:fonts.regular}}>Remaining stocks</ListItem.Subtitle>
          </ListItem.Content>
    )}>
      
      </ListItem.Accordion>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.halfWhite,
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
  CardImage: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
    marginVertical: dimensions.sm,
  },
  cardContainer: {
    marginVertical: dimensions.sm / 2,
    justifyContent: 'center',
  },headerContainer: {
    backgroundColor: colors.orange,
    height: dimensions.xl * 2.25,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: colors.pureWhite,
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
  },
});

export default ViewReports;

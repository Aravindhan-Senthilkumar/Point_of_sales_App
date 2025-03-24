import {Alert, FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {Appbar, Button, Card, Text} from 'react-native-paper';
import { useNavigation} from '@react-navigation/native';
import {FAB} from '@rneui/base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Camera,CameraType} from 'react-native-camera-kit';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import AntDesign from 'react-native-vector-icons/AntDesign'
import { getFirestore } from '@react-native-firebase/firestore';
import useProductStore from '../store/useProductStore';
import { ActivityIndicator } from 'react-native-paper';
import { SearchBar } from '@rneui/themed';
import useAgentStore from '../store/useAgentStore';

const AgentProductsListScreen = () => {
  const navigation = useNavigation();
  const [isScanning, setIsScanning] = useState(false);
  const [productListsData,setProductListsData] = useState([]);
  console.log('productListsData: ', productListsData);
  const { isProductUpdated,setIsProductUpdated } = useProductStore();
  const { agent } = useAgentStore();

  const fetchProductLists = useCallback(async () => {
    setLoading(true)
    try {
      if (!agent?.AgentID) {
        console.log("Error: Agent ID is missing or invalid.");
        return;
    }
  
    const agentDoc = await getFirestore()
        .collection('agent-products')
        .doc(agent.AgentID)
        .get();
  
    if (!agentDoc.exists) {
        console.log("No assigned products found for this agent.");
        return;
    }
      const data = Object.values(agentDoc.data())
      console.log('data: ', data);
      setProductListsData(data.flat());
    } catch (error) {
      console.error("Error while fetching product lists:", error);
    }finally{
      setLoading(false)
    }
  }, []); 
  useEffect(() => {
    fetchProductLists();
  }, [fetchProductLists]);

  useEffect(() => {
    setLoading(true)
    if (isProductUpdated) {
      fetchProductLists();
      setIsProductUpdated(false);
    }
  }, [isProductUpdated, fetchProductLists]);

  //Function to handle camera permission
  const handleBarCodeScan = async () => {
    try{
      const permissionStatus = await check(PERMISSIONS.ANDROID.CAMERA)
      console.log('permissionStatus: ', permissionStatus);
      if(permissionStatus === RESULTS.GRANTED){
        setIsScanning(true)
      }else if(permissionStatus === RESULTS.DENIED || permissionStatus === RESULTS.UNAVAILABLE){
        const result = await request(PERMISSIONS.ANDROID.CAMERA);
        if(result === RESULTS.GRANTED){
          setIsScanning(true);
        }else{
          Alert.alert(
            'Permission Denied',
            'Camera permission is required to scan barcodes. Please enable it in settings.',
          );
        }
      }else if(permissionStatus === RESULTS.BLOCKED){
        Alert.alert(
          'Permission Blocked',
          'Camera permission is blocked. Please enable it in your device settings.',
        );
      }
    }catch(error){
      console.log("Error while requesting permission")
    }
  }
  
  const cancelScanning = () => {
    setIsScanning(false);
    console.log('Barcode scanning cancelled');
  };

  const findProductUsingBarcode = async (barcode) => {
    try {
      const querySnapShot = await (await getFirestore().collection('agent-products').doc(agent.AgentID).get()).data();
      
      if (!querySnapShot) {
        console.log("No products found for this agent.");
        return;
      }
  
      // Flatten the object values to get an array of products
      const valueSnapShot = Object.values(querySnapShot).flat();
      console.log('All agent products:', valueSnapShot);
  
      // Find the product with the given barcode
      const foundProduct = valueSnapShot.find(product => product.Barcode === barcode);
  
      if (foundProduct) {
        console.log('Product found:', foundProduct);
        navigation.navigate('ProductDetailsScreen',{ item:foundProduct })
      } else {
        console.log('No product found with this barcode.');
        return null;
      }
    } catch (error) {
      console.log("Error in internal server while searching for product using barcode:", error);
    }
  };

  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = productListsData.filter((item) => (item.ProductName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
  item.ProductId.toString().toLowerCase().includes(searchQuery.toLowerCase().trim()
)))

  return (
    <View style={styles.container}>

      {/* Header Container */}
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Products"
          color={colors.pureWhite}
          titleStyle={styles.headerText}
        />
      </Appbar.Header>
      <SearchBar
      autoCapitalize='sentences'
      placeholder='Search products'
      value={searchQuery}
      onChangeText={(text) => setSearchQuery(text)} 
      containerStyle={{ backgroundColor:colors.halfWhite,borderColor:colors
        .halfWhite
       }}
       inputContainerStyle={{ 
        backgroundColor:colors.lightGray,
        borderRadius:dimensions.xl,
        padding:0,
        height:dimensions.xl * 1.3,
      }}
      leftIconContainerStyle={{ marginLeft:dimensions.md }}
      rightIconContainerStyle={{  marginRight:dimensions.sm }}
      inputStyle={{ fontSize:dimensions.sm * 1.15 }}
      />
      {/* Tooltip for Barcode Scanner */}
      <View style={styles.BarCodeContainer}>
        <FAB
          icon={
            <MaterialCommunityIcons
              size={dimensions.md}
              name="barcode-scan"
              color={colors.pureWhite}
            />
          }
          color={colors.darkblue}
          buttonStyle={{width: dimensions.xl * 2, height: dimensions.xl * 2}}
          radius={dimensions.xl}
          onPress={handleBarCodeScan}
        />
      </View>
      {
      isScanning && (
        <View style={styles.scannerContainer} pointerEvents="box-none">
          <Camera
            style={styles.camera}
            scanBarcode={true}
            cameraType={CameraType.Back}
            showFrame={true}
            laserColor="red"
            frameColor="white"
            onReadCode={async (event) => {
              const barcode = event?.nativeEvent?.codeStringValue || event?.codeStringValue;
              if (barcode) {
              findProductUsingBarcode(barcode);
              setIsScanning(false);
              }
            }}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelScanning}
          >
            <AntDesign
              name="close"
              size={dimensions.xl}
              color={colors.pureWhite}
            />
          </TouchableOpacity> 
        </View>
      )
      } 
      
      {
        loading 
        ? (
          <View style={{ justifyContent:'center',alignItems:'center',flex:1 }}>
          <ActivityIndicator 
          color={colors.darkblue}
          size='large'
          />
          </View>
        )
        : (
          <FlatList
      showsVerticalScrollIndicator={false}
      data={searchQuery.trim() 
        ? filteredProducts
        : productListsData}
      renderItem={({ item }) => {
        console.log('item: ', item);
        return (
        <View style={{ marginHorizontal:dimensions.sm / 2 }}>
        <Card contentStyle={{ backgroundColor:colors.pureWhite,paddingHorizontal:dimensions.md,borderRadius:dimensions.sm }} mode="elevated" style={styles.cardContainer} onPress={() => navigation.navigate('ProductDetailsScreen',{ item })}>
        <View style={{flexDirection: 'row'}}>
          <Card.Cover
            source={{uri: item.ProductImage}}
            style={styles.CardImage}
            />
          <View style={{justifyContent:'center'}}>
                      <Card.Content>
                        <View
                          style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                          <View style={{ flexDirection:'row', justifyContent:'space-between',alignItems:'center',width:'85%'}}>
                          <Text style={{ fontFamily:fonts.regular }}>Product Id: <Text style={{ fontFamily:fonts.semibold }}> {item.ProductId}</Text></Text>
                          </View>
                        </View>
                        <Text style={{ fontFamily:fonts.regular }}>Product Name: <Text style={{ fontFamily:fonts.semibold }}> {item.ProductName}</Text></Text>
                        <Text style={{ fontFamily:fonts.regular }}>Brand: <Text style={{ fontFamily:fonts.semibold }}> {item.BrandName}</Text></Text>
                        <Text style={{ fontFamily:fonts.regular }}>Category: <Text style={{ fontFamily:fonts.semibold }}> {item.Category}</Text></Text>
                      </Card.Content>
                    </View>
        </View>
      </Card>
      </View>
        );
      }}
      ListEmptyComponent={(
      <View style={{ flex:1,justifyContent:'center',alignItems:'center',height:dimensions.height/1.4}}>
      <Text style={{ fontFamily:fonts.light,fontSize:dimensions.xl/2.25 }}>No product assignments have been made...</Text>
      </View>
        )}
      />
        )

      }  
      
    </View>
  );
};

export default AgentProductsListScreen;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.orange,
    height: dimensions.xl * 2.25,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: colors.pureWhite,
    fontFamily: fonts.bold,
    fontSize: dimensions.sm * 2,
  },
  container: {
    backgroundColor: colors.halfWhite,
    flex: 1,
  },
  BarCodeContainer: {
    position: 'absolute',
    bottom: dimensions.xl,
    right: dimensions.md,
    zIndex: 10,
  },
  BarCode: {
    position: 'absolute',
    bottom: dimensions.xl * 3.5,
    right: dimensions.md,
    zIndex: 10,
  },
  noShadow: {
    elevation: 0,
    shadowOpacity: 0,
    shadowOffset: {width: 0, height: 0},
    shadowRadius: 0,
  },
  CardImage: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
    marginVertical: dimensions.sm,
  },
  cardContainer: {
    marginVertical: dimensions.sm / 2,
    justifyContent: 'center',
  },
  headerContainer: {
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
  scannerContainer: {
    ...StyleSheet.absoluteFillObject, 
    zIndex: 1000,
    elevation: 1000,
  },
  camera: {
    flex: 1,
  },
  cancelButton: {
    position: 'absolute',
    top:dimensions.xl * 1.75,
    right:dimensions.md,
  },
});

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

  const handleOnReadCode = async (event) => {
    const barcode = event?.nativeEvent?.codeStringValue || event?.codeStringValue;
              if (barcode) {
              findProductUsingBarcode(barcode);
              setIsScanning(false);
   }
  }
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
        containerStyle={styles.searchBarContainer}
        inputContainerStyle={styles.searchBarInputContainer}
        leftIconContainerStyle={styles.searchBarLeftIcon}
        rightIconContainerStyle={styles.searchBarRightIcon}
        inputStyle={styles.searchBarInput}
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
          buttonStyle={styles.fabButton}
          radius={dimensions.xl}
          onPress={handleBarCodeScan}
        />
      </View>
      {isScanning && (
        <View style={styles.scannerContainer} pointerEvents="box-none">
          <Camera
            style={styles.camera}
            scanBarcode={true}
            cameraType={CameraType.Back}
            showFrame={true}
            laserColor="red"
            frameColor="white"
            onReadCode={(event) => handleOnReadCode(event)}
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
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            color={colors.darkblue}
            size='large'
          />
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={searchQuery.trim() ? filteredProducts : productListsData}
          renderItem={({ item }) => {
            console.log('item: ', item);
            return (
              <View style={styles.cardWrapper}>
                <Card 
                  contentStyle={styles.cardContent} 
                  mode="elevated" 
                  style={styles.cardContainer} 
                  onPress={() => navigation.navigate('ProductDetailsScreen', { item })}
                >
                  <View style={styles.cardRow}>
                    <Card.Cover
                      source={{ uri: item.ProductImage }}
                      style={styles.CardImage}
                    />
                    <View style={styles.cardContentContainer}>
                      <Card.Content>
                        <View style={styles.headerRow}>
                          <View style={styles.productIdContainer}>
                            <Text style={styles.regularText}>
                              Product Id: <Text style={styles.semiboldText}>{item.ProductId}</Text>
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.regularText}>
                          Product Name: <Text style={styles.semiboldText}>{item.ProductName}</Text>
                        </Text>
                        <Text style={styles.regularText}>
                          Brand: <Text style={styles.semiboldText}>{item.BrandName}</Text>
                        </Text>
                        <Text style={styles.regularText}>
                          Category: <Text style={styles.semiboldText}>{item.Category}</Text>
                        </Text>
                      </Card.Content>
                    </View>
                  </View>
                </Card>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No product assignments have been made...</Text>
            </View>
          }
        />
      )}  
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
    fontSize: dimensions.md,
  },
  container: {
    backgroundColor: colors.halfWhite,
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
  BarCodeContainer: {
    position: 'absolute',
    bottom: dimensions.xl,
    right: dimensions.md,
    zIndex: 10,
  },
  fabButton: {
    width: dimensions.xl * 2,
    height: dimensions.xl * 2,
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
    top: dimensions.xl * 1.75,
    right: dimensions.md,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  cardWrapper: {
    marginHorizontal: dimensions.sm / 2,
  },
  cardContent: {
    backgroundColor: colors.pureWhite,
    paddingHorizontal: dimensions.md,
    borderRadius: dimensions.sm,
  },
  cardContainer: {
    marginVertical: dimensions.sm / 2,
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
  },
  CardImage: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
    marginVertical: dimensions.sm,
  },
  cardContentContainer: {
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '85%',
  },
  regularText: {
    fontFamily: fonts.regular,
  },
  semiboldText: {
    fontFamily: fonts.semibold,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: dimensions.height / 1.4,
  },
  emptyListText: {
    fontFamily: fonts.light,
    fontSize: dimensions.xl / 2.25,
  },
});
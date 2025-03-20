import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useCallback, useEffect, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Modal,
} from 'react-native-paper';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {Divider, ListItem, SearchBar} from '@rneui/themed';
import {getFirestore} from '@react-native-firebase/firestore';
import AntDesign from 'react-native-vector-icons/AntDesign';
import useAssigningStore from '../store/useAssigningStore';

const ProductItem = memo(({item, onPress}) => (
  <Pressable style={{marginHorizontal: dimensions.sm / 2}} onPress={onPress}>
    <Card
      contentStyle={{
        backgroundColor: colors.pureWhite,
        paddingHorizontal: dimensions.sm,
        borderRadius: dimensions.sm,
      }}
      mode="elevated"
      style={styles.cardContainer}>
      <View style={{flexDirection: 'row'}}>
        <Card.Cover
          source={{uri: item.ProductImage}}
          style={styles.CardImage}
        />
        <View style={{justifyContent: 'center'}}>
          <Card.Content>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '85%',
                }}>
                <Text style={{fontFamily: fonts.regular}}>
                  Product Id:{' '}
                  <Text style={{fontFamily: fonts.semibold}}>
                    {' '}
                    {item.ProductId}
                  </Text>
                </Text>
              </View>
            </View>
            <Text style={{fontFamily: fonts.regular}}>
             Product Name:{' '}
              <Text style={{fontFamily: fonts.semibold}}>
                {' '}
                {item.ProductName}
              </Text>
            </Text>
          </Card.Content>
        </View>
      </View>
    </Card>
  </Pressable>
));

const AssignViewScreen = () => {
  const item = useRoute().params.data;
  console.log('item: ', item);
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(false);

  //Zustand Store
  const { stockEntry,setStockEntry,setTotalStockPrice,setTotalStockNos,totalStockPrice,totalStockNos,resetStocks,resetTotals } = useAssigningStore();
  console.log('stockEntry: ', stockEntry);

  //Date
  const today = new Date();
  const formattedDate =
    today.getDate().toString().padStart(2, '0') +
    '/' +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    '/' +
    today.getFullYear().toString();

  //FlatList Rendering for Products
  const [fetchProductsLoader, setFetchProductsLoader] = useState(false);
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const fetchProductLists = useCallback(async () => {
    setFetchProductsLoader(true);
    try {
      const productsSnap = await getFirestore().collection('products').get();
      const productsData = await productsSnap.docs.map(item => item.data());
      setFetchedProducts(productsData);
    } catch (error) {
      console.log('Error in internal server while fetching products', error);
    } finally {
      setFetchProductsLoader(false);
    }
  }, []);
  useEffect(() => {
    fetchProductLists();
  }, [fetchProductLists]);

  const [singleProduct, setSingleProduct] = useState({});
  console.log('singleProduct: ', singleProduct);

  const handlePress = item => {
    setIsVisible(true);
    setSingleProduct(item);
  };

  const renderItem = useCallback(
    ({item}) => <ProductItem item={item} onPress={() => handlePress(item)} />,
    [handlePress],
  );
  const keyExtractor = useCallback(item => String(item.ProductId), []);
  
  //SearchBar Query
  const [searchQuery, setSearchQuery] = useState('');
  const filteredProducts = fetchedProducts.filter(
    item =>
      item.ProductName.toLowerCase().includes(
        searchQuery.toString().toLowerCase().trim(),
      ) ||
      item.ProductId.toString()
        .toLowerCase()
        .includes(searchQuery.toString().toLowerCase()),
  );

  //Stock Entry Modal
  const [stockEntryLoader, setStockEntryLoader] = useState(false);
  const [addedStocks, setAddedStocks] = useState([]);
  const [errorInput, setErrorInput] = useState(false);
  const handleInputChange = (index, text, item) => {
    const numericValue = text.replace(/[^0-9]/g, '')
    const stockLimit = item.stocks
    const cappedValue = Math.min(Number(numericValue),stockLimit)
    setErrorInput(false)
    setAddedStocks(prev => {
      const existingIndex = prev.findIndex(entry => entry.id === index);
      if (existingIndex !== -1) {
        return prev.map((entry, i) =>
          i === existingIndex ? {...entry, assignedValue: cappedValue,totalStocks:cappedValue} : entry,
        );
      } else {
        return [
          ...prev,
          {
            id: index,
            assignedValue: cappedValue,
            weight: item.weight,
            price: item.price,
            totalStocks:cappedValue
          },
        ];
      }
    });
  };

  const handleConfirmEntry = () => {
    setStockEntryLoader(true)
    if(addedStocks.length === 0){
      console.log("Invalid entry")
      setErrorInput(true)
      setStockEntryLoader(false);
      return;
    }
    try{
      const today = new Date();
      const formattedDate =
      today.getDate().toString().padStart(2, '0') +
      '/' +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      '/' +
      today.getFullYear();
      console.log(formattedDate);
      const totalStocks = addedStocks.reduce((prev,curr) => prev + (curr.assignedValue),0)
      setTotalStockNos(totalStocks);
      const totalPrice = addedStocks.reduce((prev,curr) => prev + (curr.assignedValue * curr.price),0);
      setTotalStockPrice(totalPrice)
      setStockEntry((prev) => {
        const existingStock = prev.findIndex(
          item => item.ProductId === singleProduct.ProductId,
        );
        console.log('existingStock: ', existingStock);
        if (existingStock !== -1) {
          return prev.map((item, index) =>
            index === existingStock ? {...item, addedStocks: addedStocks} : item,
          );
        } else {
          return [
            ...prev,
            {
              ProductId: singleProduct.ProductId,
              ProductName: singleProduct.ProductName,
              Stocks: addedStocks,
              BarcodeImageUri:singleProduct.BarcodeImageUri,
              Barcode:singleProduct.Barcode,
              Category:singleProduct.Category,
              Description:singleProduct.Description,
              ProductImage:singleProduct.ProductImage,
              BrandName:singleProduct.BrandName,
              TotalPrice:totalPrice,
              TotalStocks:totalStocks,
              Date:formattedDate
            },
          ];
        }
      })
    }catch(error){
      console.log("Error while confirming entry",error)
    }finally{
      setTimeout(() => {
        setAddedStocks([])
        setStockEntryLoader(false);
        setIsVisible(false)
      }, 400);
    }
  };

  // Stock Modal Dismiss Function
  const handleDismiss = () => {
    setErrorInput(false)
    setAddedStocks([])  
    setIsVisible(!isVisible)
  }

  // Expanded States for ListItem
  const [expandedItems, setExpandedItems] = useState({});
  const toggleAccordion = (productId) => {
  setExpandedItems((prev) => ({
    ...prev,
    [productId]: !prev[productId],
  }));
};

// Clearing stocks and totals from zustand store
const handleClearStocks = () => {
  resetTotals();
  resetStocks()
}

// checkBox functions
  const [checkedItems, setCheckedItems] = useState({});
  console.log('checkedItems: ', checkedItems);
  const handleCheckedAccordion = (productId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [productId] : !prev[productId]
    }))
  }

  const handleDeleteCheckedItems = () => {

     // Extract checked ProductId values
     const checkedProductIds = Object.entries(checkedItems)
     .filter(([_, isChecked]) => isChecked)
     .map(([key]) => Number(key));

     console.log('Checked Product IDs: ', checkedProductIds);

    // Calculate total price of checked items
    const totalPriceToRemove = stockEntry
    .filter(item => checkedProductIds.includes(item.ProductId))
    .reduce((total, item) => {
      const itemTotalPrice = item.Stocks.reduce((prev,curr) => prev + (curr.assignedValue * curr.price),0)
      return total + itemTotalPrice;
    }, 0);
    console.log('totalPriceToRemove: ', totalPriceToRemove);
    resetTotals()
    setTotalStockPrice(totalStockPrice - totalPriceToRemove)
    // Calculate total stocks of checked Items
    const totalStocksToRemove = stockEntry
    .filter(item => checkedProductIds.includes(item.ProductId))
    .reduce((total, item) => {
      const itemTotalStocks = item.Stocks.reduce((prev,curr) => prev + (curr.assignedValue),0)
      return total + itemTotalStocks;
    }, 0);
    console.log('totalStocksToRemove: ', totalStocksToRemove);
    setTotalStockNos(totalStockNos - totalStocksToRemove)
     // Update state with the filtered stock entry
    setStockEntry(prevStock => prevStock.filter(item => !checkedProductIds.includes(item.ProductId)));
      // Clear checked items after deletion
    setCheckedItems({});
    
  }
  
const [assigningLoader, setAssigningLoader] = useState(false);
const handleAssignAndRemoveStocks = async () => {
  setAssigningLoader(true);
  try {
    console.log('item.AgentID: ', item.AgentID);
    if(stockEntry.length === 0){

      return;
    }
    const agentProductsRef = getFirestore().collection('agent-products').doc(item.AgentID);
    
    // Check if Agent exists
    if (!(await agentProductsRef.get()).exists) {
      console.log("Agent ID not found");
    }

    // Assign products to agent
   await agentProductsRef.set({ products: [...stockEntry] });
    console.log("Products assigned to agent successfully");

    // Update product stocks in Firestore
    for (const productItem of stockEntry) {
      const productId = productItem.ProductId.toString();
      console.log('Updating stock for productId:', productId);

      const productRef = getFirestore().collection('products').doc(productId);
      const productSnap = await productRef.get();

      if (!productSnap.exists) {
        console.error('Product not found in Firestore:', productId);
        continue;
      }

      const productData = productSnap.data();
      const updatedStocks = productData.Stocks.map((stock) => {
        const soldItem = productItem.Stocks.find((s) => s.weight === stock.weight);
        if (soldItem) {
          return { ...stock, stocks: Math.max(0, stock.stocks - soldItem.assignedValue) }; // Deduct stock
        }
        return stock;
      });

      console.log('updatedStocks:', updatedStocks);

      // Update Firestore with new stock values
      await productRef.update({ Stocks: updatedStocks });
      console.log(`Stock updated successfully for Product ID: ${productId}`);
    }

    // Clear checked items and reset state
    await setCheckedItems({});
    await handleClearStocks();
    navigation.goBack();
  } catch (error) {
    console.error("Error in internal server while assigning and updating stocks:", error);
  } finally {
    setAssigningLoader(false);
  }
};

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Assigning Stocks"
          color={colors.pureWhite}
          titleStyle={styles.headerText}
        />
      </Appbar.Header>
      <View
        showsVerticalScrollIndicator={false}
        style={{marginTop: dimensions.sm}}>
        <View style={styles.section}>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.label}>Date of Assigning: </Text>
            <Text style={styles.label2}>{formattedDate}</Text>
          </View>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.label}>Agent Name: </Text>
            <Text style={styles.label2}>{item.AgentName}</Text>
          </View>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.label}>AgentID: </Text>
            <Text style={styles.label2}>{item.AgentID}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Product Lists</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={text => setSearchQuery(text)}
            placeholder="Search Products"
            containerStyle={{
              backgroundColor: colors.pureWhite,
              borderColor: colors.pureWhite,
            }}
            inputContainerStyle={{
              backgroundColor: colors.lightGray,
              borderRadius: dimensions.xl,
              padding: 0,
              height: dimensions.xl,
            }}
            leftIconContainerStyle={{marginLeft: dimensions.md}}
            rightIconContainerStyle={{marginRight: dimensions.sm}}
            inputStyle={{fontSize: dimensions.sm }}
          />
          {fetchProductsLoader ? (
            <View
              style={{
                height: dimensions.height / 5,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ActivityIndicator
                size="large"
                animating={true}
                color={colors.darkblue}
              />
            </View>
          ) : (
            <FlatList
              showsVerticalScrollIndicator={false}
              style={[
                {height: dimensions.height / 5},
                filteredProducts.length === 0 && {height: dimensions.xl},
              ]}
              data={searchQuery.trim() ? filteredProducts : fetchedProducts}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={
                <View>
                  <Text style={{textAlign: 'center'}}>No Products Found</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection:'row',justifyContent:'space-between',marginBottom:dimensions.sm/2 }}>
          <Text style={styles.label}>Stocks Summary</Text>
          {
            Object.values(checkedItems).some(value => value)
            ? (
            <TouchableOpacity onPress={handleDeleteCheckedItems}>
            <Text style={{ color:'red',fontFamily:fonts.semibold }}>Clear selected</Text>
          </TouchableOpacity>
            ) 
            : (
          <TouchableOpacity onPress={handleClearStocks}>
          <Text style={{ color:'red',fontFamily:fonts.semibold }}>Clear all</Text>
          </TouchableOpacity>
            )
          }
          
          </View>
          <FlatList
          keyExtractor={(item) => item.ProductId}
          showsVerticalScrollIndicator={false}
          style={[{ height:dimensions.height/4.75 }, stockEntry.length === 0 && { height:dimensions.md}]}
          data={stockEntry}
          renderItem={({ item }) => {
            const itemStockArray = item.Stocks || []
            const totalStocks = itemStockArray.reduce((prev,curr) => prev + (curr.assignedValue),0)
            const totalPrice = itemStockArray.reduce((prev,curr) => prev + (curr.assignedValue * curr.price),0);
            return (
              <ListItem.Accordion topDivider isExpanded={expandedItems[item.ProductId] || false} 
              onPress={() => toggleAccordion(item.ProductId)}
          content={
              <>
              <ListItem.Content style={{ marginVertical: dimensions.sm / 6, justifyContent: 'space-between'}}>
                  <View style={{ flexDirection:'row',alignItems:'center',gap:dimensions.sm/2 }}>
                  <ListItem.CheckBox onPress={()  => handleCheckedAccordion(item.ProductId)} checked={checkedItems[item.ProductId] || false}/>
                  <View>
                  <Text style={styles.stockTextStyle}>Product Id:<Text style={styles.stockInnerTextStyle}> {item.ProductId}</Text></Text>
                  <Text style={styles.stockTextStyle}>Product Name:<Text style={styles.stockInnerTextStyle}> {item.ProductName}</Text></Text>
                  <Text style={styles.stockTextStyle}>Assigned Stocks:<Text style={styles.stockInnerTextStyle}> {totalStocks} Nos</Text></Text>
                  <Text style={styles.stockTextStyle}>Total Price:<Text style={styles.stockInnerTextStyle}> ₹ {totalPrice}</Text></Text>
                  </View>
                  </View>
              </ListItem.Content>
              </>
            }
            containerStyle={{ padding:dimensions.sm/2 }}
            >
                <ListItem topDivider key={item.id}>
                <View style={{ flex:1 }}>
                <View style={{ flexDirection:'row',flex:1,borderColor:colors.lightGray,borderTopWidth:1,borderBottomWidth:1,paddingVertical:dimensions.sm/2,paddingHorizontal:dimensions.sm/4,justifyContent:'space-between' }}>
                  <Text style={styles.stockSummaryHeader}>Weight</Text>
                  <Text style={styles.stockSummaryHeader}>Assigned Stocks</Text>
                  <Text style={styles.stockSummaryHeader}>Price</Text>
                </View>
                {
                  itemStockArray.map((item,index) => {
                    return (
                      <View
                      key={index}
                      style={{ flexDirection:'row',justifyContent:'space-between',flex:1,paddingVertical:dimensions.sm/2,paddingHorizontal:dimensions.sm/4 }}>
                  <Text style={styles.stockSummaryLabel}>{item.weight}(₹{item.price})</Text>
                  <Text style={styles.stockSummaryLabel}>{item.assignedValue}</Text>
                  <Text style={styles.stockSummaryLabel}>₹ {item.assignedValue * item.price}</Text>
                </View>
                    )})
                }
                </View>
              </ListItem>
          </ListItem.Accordion>
            )
          }}
          ListEmptyComponent={(
              <Text style={{ textAlign:'center',fontFamily:fonts.regular }}>No Stocks are Added</Text>
        )}
          />
      </View>
      </View>



      <View style={styles.footerView}>
        <Text style={styles.footerText1}>Total No of Stocks: <Text style={styles.footerText2}>{totalStockNos}</Text></Text>
        <Text style={styles.footerText1}>Total Price: <Text style={styles.footerText2}>₹ {totalStockPrice}</Text></Text>
        <Button
          onPress={handleAssignAndRemoveStocks}
          loading={assigningLoader}
          mode="contained"
          buttonColor={colors.darkblue}
          textColor={colors.pureWhite}>
            {
              assigningLoader 
              ? 'Assigning.....'
              : 'Assign to Agent'
            }
        </Button>
      </View>


      {/* Stock Entry Modal    */}
      {singleProduct && (
        <Modal
          onDismiss={handleDismiss}
          visible={isVisible}
          contentContainerStyle={{
            backgroundColor: colors.halfWhite,
            borderRadius: dimensions.sm,
            justifyContent: 'center',
            marginHorizontal: dimensions.sm,
            paddingVertical: dimensions.sm,
          }}>
          <AntDesign
            onPress={handleDismiss}
            name="close"
            size={dimensions.sm * 2}
            style={{alignSelf: 'flex-end', marginRight: dimensions.sm}}
          />
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: dimensions.md,
              textAlign: 'center',
            }}>
            Stock Entry
          </Text>

          <Divider />

          <View
            style={{marginLeft: dimensions.sm, marginVertical: dimensions.sm}}>
            <View style={{flexDirection: 'row', gap: dimensions.sm / 2}}>
              <Text
                style={{fontFamily: fonts.regular, fontSize: dimensions.sm}}>
                Product ID :
              </Text>
              <Text style={{fontFamily: fonts.bold, fontSize: dimensions.sm}}>
                {singleProduct.ProductId}
              </Text>
            </View>
            <View style={{flexDirection: 'row', gap: dimensions.sm / 2}}>
              <Text
                style={{fontFamily: fonts.regular, fontSize: dimensions.sm}}>
                Product Name :
              </Text>
              <Text style={{fontFamily: fonts.bold, fontSize: dimensions.sm}}>
                {singleProduct.ProductName}
              </Text>
            </View>
          </View>

          <Divider />

          <View style={{marginTop: dimensions.sm, marginLeft: dimensions.sm}}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: dimensions.xl/2,
                marginBottom: dimensions.sm / 2,
                textAlign:'center'
              }}>
              Stocks
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: dimensions.sm / 2,
              borderBottomWidth: 1,
              borderColor: colors.lightGray,
              backgroundColor: colors.halfWhite,
              borderTopWidth: 1,
            }}>
            <Text style={styles.tableHeader}>Weight</Text>
            <Text style={styles.tableHeader}>Available</Text>
            <Text style={styles.tableHeader}>Stock Assign</Text>
          </View>
          {singleProduct?.Stocks?.map((item, index) => {
           const assignedValue = addedStocks[index]?.assignedValue || 0; // Default to "0" if undefined
           const stockLimit = item.stocks || 0; // Ensure stock is not undefined
           const cappedValue = Math.min(assignedValue, stockLimit).toString(); // Prevent exceeding stock

           const incrementStock = (index,item) => {
            if(cappedValue === 0){
              console.log("Invalid input value")
              return;
            }
           setAddedStocks((prev) => {
            const existingProduct = prev.findIndex((entry) => entry.id === index)
            if(existingProduct !== -1){
              return prev.map((entry,i) => 
                i === existingProduct
                ? { ...entry, assignedValue: (Number(entry.assignedValue) || 0) + 1,totalStocks: (Number(entry.assignedValue) || 0) + 1} 
                : entry
                )
            }else{
              return [
                ...prev,
                {
                  id: index, // Ensure a unique ID
                  assignedValue: 1, // Start from 1
                  weight: item.weight,
                  price: item.price,
                  totalStocks:1
                },
              ];
            }
           })
           }

           const decrementStock = (index,item) => {
            if(cappedValue === 0){
              console.log("Invalid input value")
              return;
            }
            setAddedStocks((prev) => {
            const existingProduct = prev.findIndex((entry) => entry.id === index)
            if(existingProduct !== -1){
              return prev.map((entry,i) => 
                i === existingProduct
                ? { ...entry, assignedValue: Math.max((Number(entry.assignedValue) || 0) - 1, 0),totalStocks: Math.max((Number(entry.assignedValue) || 0) - 1, 0),} 
                : entry
                )
            }else{
              return [
                ...prev,
                {
                  id: index,
                  assignedValue: 0,
                  weight: item.weight,
                  price: item.price,
                  totalStocks: 0
                },
              ];
            }
           })
           }
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  <Text style={{fontWeight: '700'}}>{item.weight}</Text>(₹{' '}
                  {item.price})
                </Text>
                <Text style={styles.tableCell}>{item.stocks}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: dimensions.sm / 2,
                    marginRight: dimensions.sm / 2,
                  }}>
                  <TouchableOpacity onPress={() => incrementStock(index,item)}>
                    <AntDesign name="plus" size={dimensions.md} />
                  </TouchableOpacity>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.lightGray,
                      width: dimensions.md * 3,
                      height: dimensions.md * 2,
                      padding: 0,
                    }}>
                    <TextInput
                      style={{alignSelf: 'center'}}
                      key={index}
                      value={cappedValue}
                      onChangeText={text =>
                        handleInputChange(index, text, item)
                      }
                      keyboardType="number-pad"
                      maxLength={item.stocks.toString().length}
                      placeholder={
                          addedStocks[index]?.assignedValue.toString()
                          ? addedStocks[index]?.assignedValue.toString()
                          : '0'
                      }
                    />
                  </View>
                  <TouchableOpacity onPress={() => decrementStock(index,item)}>
                    <AntDesign name="minus" size={dimensions.md} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {
            errorInput && 
            (
              <Text style={{ textAlign:'center',color:'red',fontFamily:fonts.semibold,marginTop:dimensions.sm/2 }}>Enter valid Stock NOs</Text>
            )
          }
          <Button
            onPress={() => handleConfirmEntry()}
            loading={stockEntryLoader}
            mode="contained"
            buttonColor={colors.darkblue}
            style={{marginHorizontal: dimensions.md, marginTop: dimensions.sm/2}}>
            {stockEntryLoader ? 'Confirming....' : 'Confirm Entry'}
          </Button>
        </Modal>
      )}
    </View>
  );
};

export default AssignViewScreen;

const styles = StyleSheet.create({
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
  container: {
    backgroundColor: colors.halfWhite,
    flex: 1,
  },
  section: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    padding: dimensions.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: dimensions.sm,
    marginHorizontal: dimensions.sm,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: dimensions.sm,
    color: colors.black,
  },
  label2: {
    fontFamily: fonts.regular,
  },
  CardImage: {
    height: dimensions.xl * 1.5,
    width: dimensions.xl * 1.5,
    marginVertical: dimensions.sm,
  },
  cardContainer: {
    marginVertical: dimensions.sm / 3,
    justifyContent: 'center',
  },
  footerView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.pureWhite,
    paddingHorizontal: dimensions.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    elevation: 4,
    paddingVertical: dimensions.sm/2,
  },
  tableHeader: {
    flex: 1, // Equal width for each column
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: dimensions.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.sm / 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: dimensions.sm,
  },
  stockTextStyle:{
    fontFamily:fonts.regular
  },
  stockInnerTextStyle:{
    fontFamily:fonts.bold
  },
  stockSummaryHeader:{
    fontFamily:fonts.semibold,
    flex:1,
    textAlign:'center'
  },
  stockSummaryLabel:{
    fontFamily:fonts.regular,
    flex:1,
    textAlign:'center',
    fontSize:dimensions.sm
  },
  footerText1:{
    fontFamily:fonts.regular,
    textAlign:'right',
    fontSize:dimensions.xl/2.25
  },
  footerText2:{
    fontFamily:fonts.bold,
  }
});

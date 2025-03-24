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
import { useNavigation, useRoute} from '@react-navigation/native';
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
import Dialog from "react-native-dialog";

const ProductItem = memo(({ item, onPress }) => (
  <Pressable style={styles.pressableContainer} onPress={onPress}>
    <Card
      contentStyle={styles.cardContent}
      mode="elevated"
      style={styles.cardContainer}
    >
      <View style={styles.cardRow}>
        <Card.Cover source={{ uri: item.ProductImage }} style={styles.CardImage} />
        <View style={styles.cardContentContainer}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.productIdContainer}>
                <Text style={styles.regularText}>
                  Product Id:{' '}
                  <Text style={styles.semiboldText}>{item.ProductId}</Text>
                </Text>
              </View>
            </View>
            <Text style={styles.regularText}>
              Product Name:{' '}
              <Text style={styles.semiboldText}>{item.ProductName}</Text>
            </Text>
          </Card.Content>
        </View>
      </View>
    </Card>
  </Pressable>
));

const AssignViewScreen = () => {

  //When adding stocks it didnt increment the stock in global state
  const item = useRoute().params.data;
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [emptyDialogVisible, setEmptyDialogVisible] = useState(false);
  const [selectedDialogVisible,setSelectedDialogVisible ] = useState(false);
  const [allStocksDeleteDialog, setAllStocksDeleteDialog] = useState(false);
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
      const productsData = productsSnap.docs.map(item => item.data());
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
    const numericValue = text.replace(/[^0-9]/g, '');
    const stockLimit = item.stocks || 0;
    const cappedValue = Math.min(Number(numericValue), stockLimit);
    setErrorInput(false);
  
    setAddedStocks((prev) => {
      const existingIndex = prev.findIndex(entry => entry.weight === item.weight); // Use weight as key
      if (existingIndex !== -1) {
        return prev.map((entry, i) =>
          i === existingIndex
            ? { ...entry, assignedValue: cappedValue, totalStocks: cappedValue }
            : entry
        );
      } else {
        return [
          ...prev,
          {
            id: `${singleProduct.ProductId}-${item.weight}`, // Unique ID
            assignedValue: cappedValue,
            weight: item.weight,
            price: item.price,
            totalStocks: cappedValue,
          },
        ];
      }
    });
  };

  const handleConfirmEntry = useCallback(() => {
    setStockEntryLoader(true);
    if (addedStocks.length === 0) {
      console.log("Invalid entry: No stocks added");
      setErrorInput(true);
      setStockEntryLoader(false);
      return;
    }
  
    try {
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  
      const totalStocks = addedStocks.reduce((sum, curr) => sum + (curr.assignedValue || 0), 0);
      const totalPrice = addedStocks.reduce((sum, curr) => sum + ((curr.assignedValue || 0) * (curr.price || 0)), 0);
  
      setTotalStockNos(totalStocks);
      setTotalStockPrice(totalPrice);
  
      setStockEntry((prev) => {
        const existingStockIndex = prev.findIndex(item => item.ProductId === singleProduct.ProductId);
        if (existingStockIndex !== -1) {
          return prev.map((item, index) =>
            index === existingStockIndex
              ? {
                  ...item,
                  Stocks: item.Stocks.map(stockItem => {
                    const newStock = addedStocks.find(s => s.weight === stockItem.weight);
                    return newStock
                      ? {
                          ...stockItem,
                          assignedValue: (stockItem.assignedValue || 0) + newStock.assignedValue,
                          totalStocks: (stockItem.totalStocks || 0) + newStock.assignedValue,
                        }
                      : stockItem;
                  }).concat(addedStocks.filter(s => !item.Stocks.some(stockItem => stockItem.weight === s.weight))),
                  TotalStocks: (item.TotalStocks || 0) + totalStocks,
                  TotalPrice: (item.TotalPrice || 0) + totalPrice,
                }
              : item
          );
        } else {
          return [
            ...prev,
            {
              ProductId: singleProduct.ProductId,
              ProductName: singleProduct.ProductName,
              Stocks: addedStocks.map(stock => ({ ...stock })),
              BarcodeImageUri: singleProduct.BarcodeImageUri,
              Barcode: singleProduct.Barcode,
              Category: singleProduct.Category,
              Description: singleProduct.Description,
              ProductImage: singleProduct.ProductImage,
              BrandName: singleProduct.BrandName,
              TotalPrice: totalPrice,
              TotalStocks: totalStocks,
              Date: formattedDate,
            },
          ];
        }
      });
  
      setTimeout(() => {
        setAddedStocks([]);
        setStockEntryLoader(false);
        setIsVisible(false);
      }, 400);
    } catch (error) {
      console.error("Error while confirming entry:", error);
      setStockEntryLoader(false);
    }
  }, [singleProduct, addedStocks, setTotalStockNos, setTotalStockPrice]);


  // Stock Modal Dismiss Function
  const handleDismiss = () => {
    setErrorInput(false)
    setAddedStocks([])  
    setIsVisible(!isVisible)
  }

  // Expanded States for ListItem
  const [expandedItems, setExpandedItems] = useState({});
  const toggleAccordion = useCallback((productId) => {
  setExpandedItems((prev) => ({
    ...prev,
    [productId]: !prev[productId],
  }));
},[item]);

// Clearing stocks and totals from zustand store
const handleClearStocks = () => {
  resetTotals();
  resetStocks()
}

// checkBox functions
  const [checkedItems, setCheckedItems] = useState({});
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
  if(stockEntry.length === 0){
    setAssigningLoader(false)
    setEmptyDialogVisible(true)
    return;
  }
  try {
    console.log('item.AgentID: ', item.AgentID);
    const agentProductsRef = getFirestore().collection('agent-products').doc(item.AgentID);
    
    // Check if Agent exists
    if (!(await agentProductsRef.get()).exists) {
      console.log("Agent ID not found");
    }
    // Assign products to agent
   await agentProductsRef.set({ products: [...stockEntry] });
    console.log("Products assigned to agent successfully");
    const updatedSales = [];
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
      for(const singlestock of productItem.Stocks){
        updatedSales.push({
          productId: productItem.ProductId,
          productName: productItem.ProductName,
          productImage: productItem.ProductImage,
          remainingStock:singlestock.assignedValue,
          totalStock:singlestock.assignedValue,
          soldStock:0,
          weight:singlestock.weight,
          price:singlestock.price,
          totalPrice:0
        })
      }
    }
    // Create a product sales for agent for realtime updates

    const agentProductSalesRef = await getFirestore().collection('productsales').doc(item.AgentID)

    await agentProductSalesRef.set({
      CashTotal:0,
      CreditTotal:0,
      UPITotal:0,
      sales:updatedSales
    })
    // Clear checked items and reset state
    await setCheckedItems({});
    await handleClearStocks();
    handleSuccess();
  } catch (error) {
    console.error("Error in internal server while assigning and updating stocks:", error);
  } finally {
    setAssigningLoader(false);
  }
};
const [isSuccessModalVisible, setIsSuccessModalisVisible] = useState(false);

const handleSuccess = () => {
  setIsSuccessModalisVisible(true)
  setTimeout(() => {
    setIsSuccessModalisVisible(false)
    navigation.goBack();
  },800)
}

const handleEmptyDialogVisible = () => {
  setEmptyDialogVisible(!emptyDialogVisible)
}
const handleSelectedDialogVisible = () => {
  setSelectedDialogVisible(!selectedDialogVisible)
}
const handleDeleteSelectedFunction = () => {
  handleDeleteCheckedItems();
  setSelectedDialogVisible(false);
}
const handleAllSelectedStock = () => {
  handleClearStocks();
  setAllStocksDeleteDialog(false);
}
const handleDeletedAllDialogVisible = () => {
  setAllStocksDeleteDialog(!allStocksDeleteDialog)
}
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
        style={{marginTop: dimensions.sm}}>
        <View style={styles.section}>
          <View style={styles.dateRow}>
            <Text style={styles.label}>Date of Assigning: </Text>
            <Text style={styles.label2}>{formattedDate}</Text>
          </View>
          <View style={styles.agentNameRow}>
            <Text style={styles.label}>Agent Name: </Text>
            <Text style={styles.label2}>{item.AgentName}</Text>
          </View>
          <View style={styles.agentIdRow}>
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
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchBarInputContainer}
            leftIconContainerStyle={styles.searchBarLeftIcon}
            rightIconContainerStyle={styles.searchBarRightIcon}
            inputStyle={styles.searchBarInput}
          />
          {fetchProductsLoader ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="large"
                animating={true}
                color={colors.darkblue}
              />
            </View>
          ) : (
            <FlatList
              showsVerticalScrollIndicator={false}
              style={[styles.productList, filteredProducts.length === 0 && styles.emptyProductList]}
              data={searchQuery.trim() ? filteredProducts : fetchedProducts}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={
                <View>
                  <Text style={styles.noProductsText}>No Products Found</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.stocksSummaryHeader}>
            <Text style={styles.label}>Stocks Summary</Text>
            {stockEntry.length !== 0 ? (
              Object.values(checkedItems).some(value => value) ? (
                <TouchableOpacity onPress={() => setSelectedDialogVisible(true)}>
                  <Text style={styles.clearSelectedText}>Clear selected</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setAllStocksDeleteDialog(true)}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              )
            ) : null}
          </View>
          <FlatList
            keyExtractor={(item) => item.ProductId}
            showsVerticalScrollIndicator={false}
            style={[styles.stocksList, stockEntry.length === 0 && styles.emptyStocksList]}
            data={stockEntry}
            renderItem={({ item }) => {
              console.log('item: ', item);
              const itemStockArray = item.Stocks || [];
              const totalStocks = itemStockArray.reduce((prev, curr) => prev + (curr.assignedValue), 0);
              const totalPrice = itemStockArray.reduce((prev, curr) => prev + (curr.assignedValue * curr.price), 0);
              return (
                <ListItem.Accordion
                  topDivider
                  isExpanded={expandedItems[item.ProductId] || false}
                  onPress={() => toggleAccordion(item.ProductId)}
                  content={
                    <>
                      <ListItem.Content style={styles.accordionContent}>
                        <View style={styles.accordionRow}>
                          <ListItem.CheckBox
                            onPress={() => handleCheckedAccordion(item.ProductId)}
                            checked={checkedItems[item.ProductId] || false}
                          />
                          <View>
                            <Text style={styles.stockTextStyle}>
                              Product Id: <Text style={styles.stockInnerTextStyle}>{item.ProductId}</Text>
                            </Text>
                            <Text style={styles.stockTextStyle}>
                              Product Name: <Text style={styles.stockInnerTextStyle}>{item.ProductName}</Text>
                            </Text>
                            <Text style={styles.stockTextStyle}>
                              Assigned Stocks: <Text style={styles.stockInnerTextStyle}>{totalStocks} Nos</Text>
                            </Text>
                            <Text style={styles.stockTextStyle}>
                              Total Price: <Text style={styles.stockInnerTextStyle}>₹ {totalPrice}</Text>
                            </Text>
                          </View>
                        </View>
                      </ListItem.Content>
                    </>
                  }
                  containerStyle={styles.accordionContainer}
                >
                  <ListItem topDivider key={item.id}>
                    <View style={styles.accordionDetails}>
                      <View style={styles.stockSummaryHeaderRow}>
                        <Text style={styles.stockSummaryHeader}>Weight</Text>
                        <Text style={styles.stockSummaryHeader}>Assigned Stocks</Text>
                        <Text style={styles.stockSummaryHeader}>Price</Text>
                      </View>
                      {itemStockArray.map((item, index) => (
                        <View key={index} style={styles.stockSummaryRow}>
                          <Text style={styles.stockSummaryLabel}>{item.weight}(₹{item.price})</Text>
                          <Text style={styles.stockSummaryLabel}>{item.assignedValue}</Text>
                          <Text style={styles.stockSummaryLabel}>₹ {item.assignedValue * item.price}</Text>
                        </View>
                      ))}
                    </View>
                  </ListItem>
                </ListItem.Accordion>
              );
            }}
            ListEmptyComponent={<Text style={styles.noStocksText}>No Stocks are Added</Text>}
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

      {/* Stock Entry Modal */}
      {singleProduct && (
        <Modal
          onDismiss={handleDismiss}
          visible={isVisible}
          contentContainerStyle={styles.stockModalContainer}
        >
          <AntDesign
            onPress={handleDismiss}
            name="close"
            size={dimensions.sm * 2}
            style={styles.closeIcon}
          />
          <Text style={styles.stockModalTitle}>Stock Entry</Text>
          <Divider />
          <View style={styles.stockModalDetails}>
            <View style={styles.productIdRow}>
              <Text style={styles.productIdLabel}>Product ID :</Text>
              <Text style={styles.productIdValue}>{singleProduct.ProductId}</Text>
            </View>
            <View style={styles.productNameRow}>
              <Text style={styles.productNameLabel}>Product Name :</Text>
              <Text style={styles.productNameValue}>{singleProduct.ProductName}</Text>
            </View>
          </View>
          <Divider />
          <View style={styles.stocksSection}>
            <Text style={styles.stocksTitle}>Stocks</Text>
          </View>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeader}>Weight</Text>
            <Text style={styles.tableHeader}>Available</Text>
            <Text style={styles.tableHeader}>Stock Assign</Text>
          </View>
          {singleProduct?.Stocks?.map((item, index) => {
            const assignedValue = addedStocks[index]?.assignedValue || 0;
            const stockLimit = item.stocks || 0;
            const cappedValue = Math.min(assignedValue, stockLimit).toString();
            console.log("item", item);
            const incrementStock = (index, item) => {
              setErrorInput(false);
              setAddedStocks((prev) => {
                const existingIndex = prev.findIndex(entry => entry.weight === item.weight);
                if (existingIndex !== -1) {
                  return prev.map((entry, i) =>
                    i === existingIndex
                      ? {
                          ...entry,
                          assignedValue: Math.min((Number(entry.assignedValue) || 0) + 1, item.stocks),
                          totalStocks: Math.min((Number(entry.assignedValue) || 0) + 1, item.stocks),
                        }
                      : entry
                  );
                } else {
                  return [
                    ...prev,
                    {
                      id: `${singleProduct.ProductId}-${item.weight}`,
                      assignedValue: 1,
                      weight: item.weight,
                      price: item.price,
                      totalStocks: 1,
                    },
                  ];
                }
              });
            };
            
            const decrementStock = (index, item) => {
              setErrorInput(false);
              setAddedStocks((prev) => {
                const existingIndex = prev.findIndex(entry => entry.weight === item.weight);
                if (existingIndex !== -1) {
                  return prev.map((entry, i) =>
                    i === existingIndex
                      ? {
                          ...entry,
                          assignedValue: Math.max((Number(entry.assignedValue) || 0) - 1, 0),
                          totalStocks: Math.max((Number(entry.assignedValue) || 0) - 1, 0),
                        }
                      : entry
                  );
                }
                return prev;
              });
            };
        
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  <Text style={styles.tableCellBold}>{item.weight}</Text>(₹ {item.price})
                </Text>
                <Text style={styles.tableCell}>{item.stocks}</Text>
                <View style={styles.stockInputContainer}>
                  <TouchableOpacity onPress={() => incrementStock(index, item)}>
                    <AntDesign name="plus" size={dimensions.md} />
                  </TouchableOpacity>
                  <View style={styles.stockInputWrapper}>
                    <TextInput
                      style={styles.stockInput}
                      key={index}
                      onChangeText={text => handleInputChange(index, text, item)}
                      keyboardType="number-pad"
                      maxLength={item.stocks.toString().length}
                      value={cappedValue}
                    />
                  </View>
                  <TouchableOpacity onPress={() => decrementStock(index, item)}>
                    <AntDesign name="minus" size={dimensions.md} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {errorInput && (
            <Text style={styles.errorText}>Enter valid Stock NOs</Text>
          )}
          <Button
            onPress={handleConfirmEntry}
            loading={stockEntryLoader}
            mode="contained"
            buttonColor={colors.darkblue}
            style={styles.confirmButton}
          >
            {stockEntryLoader ? 'Confirming....' : 'Confirm Entry'}
          </Button>
        </Modal>
      )}

      {/* Empty Alert Dialog */}
      <Dialog.Container visible={emptyDialogVisible} onBackdropPress={handleEmptyDialogVisible}>
        <Dialog.Title style={styles.emptyDialogTitle}>Stocklists are empty</Dialog.Title>
        <Dialog.Description style={styles.dialogDescription}>Add stocks</Dialog.Description>
        <Dialog.Button label="Proceed" onPress={handleEmptyDialogVisible} />
      </Dialog.Container>

      {/* Selected Delete Dialog */}
      <Dialog.Container visible={selectedDialogVisible} onBackdropPress={handleSelectedDialogVisible}>
        <Dialog.Title style={styles.dialogTitle}>Clear all selected stocks</Dialog.Title>
        <Dialog.Description style={styles.dialogDescriptionLight}>Are you sure?</Dialog.Description>
        <Dialog.Button label="Accept" onPress={handleDeleteSelectedFunction} />
        <Dialog.Button label="Cancel" onPress={handleSelectedDialogVisible} />
      </Dialog.Container>

      {/* All stocks delete dialog */}
      <Dialog.Container visible={allStocksDeleteDialog} onBackdropPress={handleDeletedAllDialogVisible}>
        <Dialog.Title style={styles.dialogTitle}>Clear all stocks</Dialog.Title>
        <Dialog.Description style={styles.dialogDescriptionLight}>Are you sure?</Dialog.Description>
        <Dialog.Button label="Accept" onPress={handleAllSelectedStock} />
        <Dialog.Button label="Cancel" onPress={handleDeletedAllDialogVisible} />
      </Dialog.Container>

      <Modal visible={isSuccessModalVisible} contentContainerStyle={styles.modalContent}>
        <View style={styles.modalContent}>
          <AntDesign name="checkcircle" size={dimensions.width / 4} color="green" />
          <Text style={[styles.modalTitle, styles.modalTitleMargin]}>Assign Successful!</Text>
          <Text style={[styles.modalText, styles.modalTextMargin]}>
            Assigning stocks to agent <Text style={styles.modalTextBold}>{item.AgentID}</Text> has been completed successfully.
          </Text>
        </View>
      </Modal>
    </View>
  );
};

export default AssignViewScreen;

const styles = StyleSheet.create({
  stockModalContainer: {
    backgroundColor: colors.halfWhite,
    borderRadius: dimensions.sm,
    justifyContent: 'center',
    marginHorizontal: dimensions.sm,
    paddingVertical: dimensions.sm,
  },
  closeIcon: {
    alignSelf: 'flex-end',
    marginRight: dimensions.sm,
  },
  stockModalTitle: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    textAlign: 'center',
  },
  stockModalDetails: {
    marginLeft: dimensions.sm,
    marginVertical: dimensions.sm,
  },
  productIdRow: {
    flexDirection: 'row',
    gap: dimensions.sm / 2,
  },
  productIdLabel: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
  },
  productIdValue: {
    fontFamily: fonts.bold,
    fontSize: dimensions.sm,
  },
  productNameRow: {
    flexDirection: 'row',
    gap: dimensions.sm / 2,
  },
  productNameLabel: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
  },
  productNameValue: {
    fontFamily: fonts.bold,
    fontSize: dimensions.sm,
  },
  stocksSection: {
    marginTop: dimensions.sm,
    marginLeft: dimensions.sm,
  },
  stocksTitle: {
    fontFamily: fonts.bold,
    fontSize: dimensions.xl / 2,
    marginBottom: dimensions.sm / 2,
    textAlign: 'center',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.sm / 2,
    borderBottomWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.halfWhite,
    borderTopWidth: 1,
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
  tableCellBold: {
    fontWeight: '700',
  },
  stockInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: dimensions.sm / 2,
    marginRight: dimensions.sm / 2,
  },
  stockInputWrapper: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    width: dimensions.md * 3,
    height: dimensions.md * 2,
    padding: 0,
  },
  stockInput: {
    alignSelf: 'center',
  },
  stocksSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.sm / 2,
  },
  clearSelectedText: {
    color: 'red',
    fontFamily: fonts.semibold,
  },
  clearAllText: {
    color: 'red',
    fontFamily: fonts.semibold,
  },
  stocksList: {
    height: dimensions.height / 4.75,
  },
  emptyStocksList: {
    height: dimensions.md,
  },
  accordionContent: {
    marginVertical: dimensions.sm / 6,
    justifyContent: 'space-between',
  },
  accordionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.sm / 2,
  },
  accordionContainer: {
    padding: dimensions.sm / 2,
  },
  accordionDetails: {
    flex: 1,
  },
  stockSummaryHeaderRow: {
    flexDirection: 'row',
    flex: 1,
    borderColor: colors.lightGray,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: dimensions.sm / 2,
    paddingHorizontal: dimensions.sm / 4,
    justifyContent: 'space-between',
  },
  stockSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: dimensions.sm / 2,
    paddingHorizontal: dimensions.sm / 4,
  },
  stockTextStyle: {
    fontFamily: fonts.regular,
  },
  stockInnerTextStyle: {
    fontFamily: fonts.bold,
  },
  stockSummaryHeader: {
    fontFamily: fonts.semibold,
    flex: 1,
    textAlign: 'center',
  },
  stockSummaryLabel: {
    fontFamily: fonts.regular,
    flex: 1,
    textAlign: 'center',
    fontSize: dimensions.sm,
  },
  loaderContainer: {
    height: dimensions.height / 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productList: {
    height: dimensions.height / 5,
  },
  emptyProductList: {
    height: dimensions.xl,
  },
  noProductsText: {
    textAlign: 'center',
  },
  searchBarContainer: {
    backgroundColor: colors.pureWhite,
    borderColor: colors.pureWhite,
  },
  searchBarInputContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.xl,
    padding: 0,
    height: dimensions.xl,
  },
  searchBarLeftIcon: {
    marginLeft: dimensions.md,
  },
  searchBarRightIcon: {
    marginRight: dimensions.sm,
  },
  searchBarInput: {
    fontSize: dimensions.sm,
  },
  dateRow: {
    flexDirection: 'row',
  },
  agentNameRow: {
    flexDirection: 'row',
  },
  agentIdRow: {
    flexDirection: 'row',
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
  },
  modalContent: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    paddingVertical:dimensions.sm,
    alignItems: 'center',
    margin: dimensions.md,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
  },
  modalText: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'center',
  },
  pressableContainer: {
    marginHorizontal: dimensions.sm / 2,
  },
  cardContent: {
    backgroundColor: colors.pureWhite,
    paddingHorizontal: dimensions.sm,
    borderRadius: dimensions.sm,
  },
  cardContainer: {
    marginVertical: dimensions.sm / 3,
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
  },
  CardImage: {
    height: dimensions.xl * 1.5,
    width: dimensions.xl * 1.5,
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
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontFamily: fonts.semibold,
    marginTop: dimensions.sm / 2,
  },
  confirmButton: {
    marginHorizontal: dimensions.md,
    marginTop: dimensions.sm / 2,
  },
  emptyDialogTitle: {
    color: 'red',
    fontFamily: fonts.bold,
  },
  dialogDescription: {
    fontFamily: fonts.regular,
  },
  dialogTitle: {
    fontFamily: fonts.bold,
  },
  dialogDescriptionLight: {
    fontFamily: fonts.light,
  },
  modalContent: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    paddingVertical: dimensions.sm,
    alignItems: 'center',
    margin: dimensions.md,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
  },
  modalTitleMargin: {
    marginVertical: dimensions.sm / 2,
  },
  modalText: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'center',
  },
  modalTextMargin: {
    marginBottom: dimensions.sm / 2,
  },
  modalTextBold: {
    fontFamily: fonts.bold,
  },
  noStocksText: {
    textAlign: 'center',
    fontFamily: fonts.regular,
  },

});

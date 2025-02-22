import {StyleSheet, View} from 'react-native';
import React from 'react';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {Appbar, Card, Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import {FAB} from '@rneui/base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const AddedProductsList = () => {

  const navigation = useNavigation();

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
        <Appbar.Action
          icon="content-save"
          onPress={() => {}}
          color={colors.pureWhite}
        />
      </Appbar.Header>

      {/* Tooltip for Add Product */}
      <View style={styles.plusIconContainer}>
        <FAB
          onPress={() => navigation.navigate('ProductAddingScreen')}
          icon={{name: 'add', color: colors.pureWhite}}
          color={colors.darkblue}
          buttonStyle={{width: dimensions.xl * 2, height: dimensions.xl * 2}}
          radius={dimensions.xl}
        />
      </View>
      <View></View>

      {/* Tooltip for Barcode Scanner */}
      <View style={styles.BarCode}>
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
          onPress={() => navigation.navigate('BarcodeScannerScreen')}
        />
      </View>

      <Card mode="elevated" style={styles.cardContainer}>
        <View style={{flexDirection: 'row'}}>
          <Card.Cover
            source={{uri: 'https://picsum.photos/700'}}
            style={styles.CardImage}
          />
          <View style={{marginVertical: dimensions.sm / 2}}>
            <Card.Content>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text variant="titleMedium">Demo Item 1</Text>
                <Feather name="edit" size={dimensions.md} />
              </View>
              <Text></Text>
            </Card.Content>
          </View>
        </View>
      </Card>


    </View>
  );
};

export default AddedProductsList;

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
  plusIconContainer: {
    position: 'absolute',
    bottom: dimensions.xl,
    right: dimensions.md,
  },
  BarCode: {
    position: 'absolute',
    bottom: dimensions.xl * 3.5,
    right: dimensions.md,
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
    paddingHorizontal: dimensions.sm / 2,
    marginVertical: dimensions.sm / 2,
    marginHorizontal: dimensions.sm / 2,
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
});

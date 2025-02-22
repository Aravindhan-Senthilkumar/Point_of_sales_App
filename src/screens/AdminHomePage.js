import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const AdminHomePage = () => {

  const navigation = useNavigation();

  return (
    <View style={styles.container}>

      <Header />

      <View style={styles.mainContainer}>
        <Text style={styles.WelcomeText}>ADMIN DASHBOARD</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RegisterAgent')}>
            <MaterialCommunityIcons
              name="account-plus"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>Register Agent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AddedProductsList')}>
            <MaterialCommunityIcons
              name="plus-circle"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ListProduct')}>
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>List Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ViewReports')}>
            <MaterialCommunityIcons
              name="file-document"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, styles.logout]}
            onPress={() => navigation.navigate('Login')}>
            <MaterialCommunityIcons name="logout" size={30} color="black" />
            <Text style={styles.AdminDashboardText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </View>

      <Footer />
      
    </View>
  );
};

export default AdminHomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.halfWhite,
  },
  mainContainer: {
    marginVertical: dimensions.xl * 2,
    alignItems: 'center',
    gap: dimensions.md,
  },
  WelcomeText: {
    fontFamily: fonts.medium,
    fontSize: dimensions.xl,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: dimensions.md,
  },
  card: {
    width: '37.5%',
    height: dimensions.height / 10,
    backgroundColor: 'white',
    borderRadius: dimensions.md / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.lightGray,
    borderWidth: 1,
  },
  logout: {
    width: dimensions.width / 1.25,
  },
  AdminDashboardText: {
    fontFamily: fonts.regular,
  },
});

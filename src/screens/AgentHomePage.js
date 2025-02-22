import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {useNavigation} from '@react-navigation/native';

const AgentHomePage = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.welcomeTextContainer}>
        <Text style={styles.WelcomeText}>WELCOME AGENT</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DriveLogin')}>
          <Text>Go to drive backup page</Text>
        </TouchableOpacity>
      </View>

      <Footer />
    </View>
  );
};

export default AgentHomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.halfWhite,
  },
  WelcomeText: {
    fontFamily: fonts.medium,
    fontSize: dimensions.xl,
  },
  welcomeTextContainer: {
    marginVertical: dimensions.xl * 1.5,
    alignItems: 'center',
  },
});

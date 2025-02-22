import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Appbar, Button} from 'react-native-paper';
import {getFirestore} from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import {Overlay} from '@rneui/themed';
import AntDesign from 'react-native-vector-icons/AntDesign';

const RegisterAgent = () => {

  const navigation = useNavigation();

  //State Updates
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({
    agentName: '',
    designation: '',
    mobileNo: '',
    address: '',
    agentId: '',
  });
  const [agentName, setAgentName] = useState('');
  const [designation, setDesignation] = useState('');
  const [DOJ, setDOJ] = useState(new Date());
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const [registerError, setRegisterError] = useState('');
  
  //Register Success Function
  const successfulRegistration = () => {
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      navigation.goBack();
    }, 1200);
  };

  //UID Generation Function
  const generateAgentId = async () => {
    let uid;
    let isUnique = false;
    while (!isUnique) {
      uid = Math.floor(Math.random() * 900000 + 100000).toString(); //
      try {
        const docRef = await getFirestore().collection('agents').doc(uid).get();

        if (!docRef.exists) {
          isUnique = true;
        }
      } catch (error) {
        console.log('Error while generating Agent ID:', error);
        return null;
      }
    }
    setErrors(prev => ({...prev, agentId: ''}));
    setAgentId(uid);
  };


  //Register Agent
  const handleRegisterAgent = async () => {
    let newErrors = {};

    if (!agentName.trim()) newErrors.agentName = 'Agent Name is required.';
    if (!designation.trim()) newErrors.designation = 'Designation is required.';
    if (!mobileNo.trim()) newErrors.mobileNo = 'Mobile number is required.';
    else if (!/^\d{10}$/.test(mobileNo))
      newErrors.mobileNo = 'Enter a valid 10-digit number.';
    if (!address.trim()) newErrors.address = 'Address is required.';
    if (!agentId.trim())
      newErrors.agentId = 'Generate an Agent ID before registering.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newAgent = {
      AgentName: agentName.trimEnd(),
      Designation: designation.trimEnd(),
      DateOfJoining: DOJ.toDateString(),
      MobileNumber: mobileNo.trimEnd(),
      Address: address,
      AgentID: agentId,
    };
    try {
      if (
        agentName === '' ||
        designation === '' ||
        mobileNo === '' ||
        address === '' ||
        agentId === ''
      ) {
        console.log('Please fill the required details');
      }
      const agentSnap = await getFirestore()
        .collection('agents')
        .doc(agentId)
        .get();
      if (agentSnap.exists) {
        setRegisterError('Agent ID already exists!!!');
        return {success: false, message: 'Agent ID already exists!'};
      }
      await getFirestore().collection('agents').doc(agentId).set(newAgent);
      successfulRegistration();
      console.log('Agent saved to Firestore!', newAgent);
    } catch (error) {
      console.log('Error while registering Agent', error);
    }
  };

  return (
    <>
      <View style={styles.container}>

        <Appbar.Header style={styles.headerContainer}>
          <Appbar.BackAction
            onPress={() => navigation.goBack()}
            color={colors.pureWhite}
          />
          <Appbar.Content
            title="Register Agent"
            color={colors.pureWhite}
            titleStyle={styles.headerText}
          />
        </Appbar.Header>

        <ScrollView>
          <View style={[styles.Innercontainer]}>
            <View>
              <Text style={styles.tagName}>Username</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="account"
                  size={dimensions.md}
                  style={{marginLeft: dimensions.sm}}
                />
                <TextInput
                  placeholder="Enter agent username"
                  autoCorrect={false}
                  numberOfLines={1}
                  style={styles.textInputStyle}
                  value={agentName}
                  onChangeText={text => {
                    setAgentName(text);
                    setErrors(prev => ({...prev, agentName: ''}));
                  }}
                />
              </View>
              {errors.agentName ? (
                <Text style={styles.errorText}>{errors.agentName}</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.tagName}>Designation</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="work"
                  size={dimensions.md}
                  style={{marginLeft: dimensions.sm}}
                />
                <TextInput
                  placeholder="Enter agent designation"
                  autoCorrect={false}
                  numberOfLines={1}
                  style={styles.textInputStyle}
                  value={designation}
                  onChangeText={text => {
                    setDesignation(text);
                    setErrors(prev => ({...prev, designation: ''}));
                  }}
                />
              </View>
              {errors.designation ? (
                <Text style={styles.errorText}>{errors.designation}</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.tagName}>Date of Joining</Text>
              <Pressable
                style={[
                  styles.inputContainer,
                  {gap: dimensions.sm / 2, height: dimensions.xl * 1.5},
                ]}
                onPress={() => setOpen(true)}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={dimensions.md}
                  style={{marginLeft: dimensions.sm}}
                />
                <Text style={styles.dateText}>{DOJ.toDateString()}</Text>
              </Pressable>
            </View>
            <DatePicker
              modal
              open={open}
              date={DOJ}
              mode="date"
              onConfirm={selectedDate => {
                setOpen(false);
                setDOJ(selectedDate);
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />
            <View>
              <Text style={styles.tagName}>Mobile Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call"
                  size={dimensions.md}
                  style={{marginLeft: dimensions.sm}}
                />
                <TextInput
                  placeholder="Enter agent mobile number"
                  numberOfLines={1}
                  autoCorrect={false}
                  style={styles.textInputStyle}
                  value={mobileNo}
                  onChangeText={text => {
                    setMobileNo(text);
                    setErrors(prev => ({...prev, mobileNo: ''}));
                  }}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={10}
                />
              </View>
              {errors.mobileNo ? (
                <Text style={styles.errorText}>{errors.mobileNo}</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.tagName}>Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="location-sharp"
                  size={dimensions.md}
                  style={{
                    marginLeft: dimensions.sm,
                    alignSelf: 'flex-start',
                    marginTop: dimensions.md / 2,
                  }}
                />
                <TextInput
                  placeholder="Enter agent address"
                  multiline={true}
                  autoCorrect={false}
                  numberOfLines={5}
                  style={[
                    styles.textInputStyle,
                    {
                      height: dimensions.width / 3.5,
                      textAlignVertical: 'top',
                      paddingTop: dimensions.sm / 1.5,
                    },
                  ]}
                  value={address}
                  onChangeText={text => {
                    setAddress(text);
                    setErrors(prev => ({...prev, address: ''}));
                  }}
                />
              </View>
              {errors.address ? (
                <Text style={styles.errorText}>{errors.address}</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.tagName}>Generate Agent ID</Text>
              <View style={styles.generateContainer}>
                <View style={styles.generateInputContainer}>
                  <Ionicons
                    name="person-add"
                    size={dimensions.sm * 1.25}
                    style={{
                      marginLeft: dimensions.sm,
                      alignSelf: 'flex-start',
                      marginTop: dimensions.md / 2,
                    }}
                  />
                  <TextInput
                    placeholder="Agent ID"
                    style={styles.textInputStyle}
                    autoCorrect={false}
                    maxLength={6}
                    value={agentId}
                    editable={false}
                    onChangeText={uid => {
                      setAgentId(uid);
                    }}
                  />
                </View>
                <Button
                  onPress={generateAgentId}
                  textColor={colors.grayText}
                  labelStyle={{fontFamily: fonts.bold}}>
                  Generate
                </Button>
              </View>
              {errors.agentId ? (
                <Text style={styles.errorText}>{errors.agentId}</Text>
              ) : null}
              {registerError ? (
                <Text style={[styles.errorText, {fontSize: dimensions.sm}]}>
                  {registerError}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.LoginContainer}
              onPress={() => handleRegisterAgent()}>
              <LinearGradient
                colors={[colors.orange, colors.darkblue]}
                start={{x: 1, y: 0}}
                end={{x: 0, y: 1}}
                style={styles.gradient}>
                <Text style={styles.loginText}>Register</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Overlay isVisible={visible}>
          <AntDesign
            name="checkcircle"
            color="green"
            size={dimensions.width / 4}
            style={{alignSelf: 'center', paddingTop: dimensions.md}}
          />
          <Text
            style={{
              fontSize: dimensions.md / 1.25,
              textAlign: 'center',
              paddingHorizontal: dimensions.xl,
              paddingVertical: dimensions.md,
              fontFamily: fonts.semibold,
            }}>
            Agent Successfully Registered
          </Text>
        </Overlay>

        <Footer />
        
      </View>
    </>
  );
};

export default RegisterAgent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  Innercontainer: {
    flex: 1,
    backgroundColor: colors.halfWhite,
    alignItems: 'center',
    gap: dimensions.sm / 2,
    paddingTop: dimensions.sm / 4,
    paddingBottom: dimensions.height / 10,
  },
  inputContainer: {
    flexDirection: 'row',
    borderColor: colors.lightGray,
    borderWidth: 1,
    alignItems: 'center',
    borderRadius: dimensions.sm,
    backgroundColor: colors.pureWhite,
    gap: dimensions.sm / 2,
    width: dimensions.width / 1.25,
  },
  textInputStyle: {
    width: '80%',
    fontFamily: fonts.regular,
    textAlignVertical: 'center',
    paddingVertical: 0,
    height: dimensions.md * 2,
  },
  headerText: {
    fontFamily: fonts.bold,
    fontSize: dimensions.sm * 1.5,
    marginTop: dimensions.sm,
  },
  LoginContainer: {
    width: dimensions.width / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: dimensions.sm,
  },
  loginText: {
    color: colors.pureWhite,
    fontFamily: fonts.bold,
  },
  gradient: {
    width: dimensions.width / 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.md / 2,
    borderRadius: dimensions.sm,
  },
  tagName: {
    fontFamily: fonts.semibold,
    fontSize: dimensions.sm,
    paddingHorizontal: dimensions.sm / 2,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.darkGray,
    marginLeft: dimensions.sm / 4,
  },
  generateContainer: {
    flexDirection: 'row',
    width: dimensions.width / 1.25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: dimensions.sm,
  },
  generateInputContainer: {
    flexDirection: 'row',
    borderColor: colors.lightGray,
    borderWidth: 1,
    alignItems: 'center',
    borderRadius: dimensions.sm,
    backgroundColor: colors.pureWhite,
    gap: dimensions.sm / 2,
    width: dimensions.width / 1.9,
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: dimensions.sm * 0.8,
    marginLeft: dimensions.sm / 2,
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

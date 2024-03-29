import {
  Text,
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  ToastAndroid,
  TextInput,
} from "react-native";
import { Foundation } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";

import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SwipeUpDownModal from "react-native-swipe-modal-up-down";

export default function App() {
  const GOOGLE_MAPS_APIKEY = "AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8";
  const [currentLocation, setCurrentLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const [waypoint, setWaypoint] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [isPlay, setIsPlay] = useState(false);
  const [network, setNetwork] = useState(true);
  let [shareModal, setShareModal] = useState(false);
  let [animateModal, setanimateModal] = useState(false);
  const [name, setName] = useState("");
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 1000000,
      });

      setCurrentLocation(location.coords);
      console.warn("current", location.coords);
      const { latitude, longitude } = location.coords;

      setWaypoint([
        {
          latitude,
          longitude,
        },
      ]);

      setWaypoints([
        {
          latitude,
          longitude,
        },
      ]);
      setInitialRegion({
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    };
    getLocation();
    unsubscribe();
  }, []);

  const unsubscribe = NetInfo.addEventListener((state) => {
    console.log("Connection type", state.type);

    console.log("Is connected?", state.isConnected);
    if (state.isConnected != network) {
      setNetwork(state.isConnected);
    }
  });
  const update = async () => {
    try {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,

          distanceInterval: 10,
        },
        (location) => {
          let all = [];
          if (location.coords) {
            let bit = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            all.push(bit);
            console.log(">>>>loc88", all);
            setWaypoint(all);
            const { latitude, longitude } = location.coords;
            setWaypoints([...waypoints, { latitude, longitude }]);
          }
        }
      );
    } catch (e) {
      console.log("error", e);
    }
  };

  const refresh = () => {
    try {
      console.warn("refreshing..");
      setIsPlay(false);
      setWaypoints([]);
      setStartingPoint(null);
      getLocation();
    } catch (e) {
      console.log("error refresh refresh....", e);
    }
  };

  const storeData = async (value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem("route", jsonValue);
      showToast("Saved");
      setShareModal(false);
    } catch (e) {
      console.log("error storing data", e);
      // saving error
    }
  };
  const play = () => {
    if (isPlay) {
      showToast("Stop");
    } else {
      showToast("Start");
      update();
    }

    setIsPlay(!isPlay);
  };

  const save = () => {
    let data = {
      name: name,
      waypoints: waypoint,
      startPoint: currentLocation,
    };
    if (name == "") {
      showToast("name is required");
      setShareModal(true);
    } else {
      storeData(data);
    }
    if (network) {
      showToast("Saving route to sever...");
    } else {
      showToast("Saving route to local storage...");
    }
  };

  const showToast = (value) => {
    ToastAndroid.show(value, ToastAndroid.LONG);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ height: "90%", width: "100%" }}>
        <View
          style={{
            backgroundColor: "white",
            height: "90%",
            width: "100%",
          }}
        >
          {initialRegion && (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
            >
              {currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title={isPlay ? "Start Point" : "Current Point"}
                />
              )}

              {/* {isPlay ? (
                <MapViewDirections
                  origin={currentLocation}
                  waypoints={waypoint}
                  mode={"WALKING"}
                  destination={waypoint[waypoint.length - 1]}
                  apikey={GOOGLE_MAPS_APIKEY}
                  strokeWidth={5}
                  precision={"high"}
                  strokeColor="green"
                  optimizeWaypoints={true}
                  onStart={(params) => {
                    console.log(
                      `Started routing between "${params.origin}" and "${params.destination}"`
                    );
                  }}
                />
              ) : null} */}
              {isPlay ? (
                <Polyline
                  coordinates={waypoints}
                  strokeColor={"red"}
                  strokeWidth={6}
                  fillColor="rgba(255,0,0,0.5)"
                />
              ) : null}
            </MapView>
          )}
        </View>

        <View
          style={{
            height: "10%",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "grey",
              height: "80%",
              width: "90%",
              alignSelf: "center",
              borderRadius: 40,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{
                height: "90%",
                width: "30%",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 50,
              }}
              onPress={() => refresh()}
            >
              <Foundation name="refresh" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: isPlay ? "red" : "#66D282",
                height: 60,
                width: 60,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 100,
                marginTop: "-20%",
                borderWidth: 5,
                borderColor: "white",
              }}
              onPress={() => play()}
            >
              {isPlay ? (
                <FontAwesome name="stop" size={24} color="white" />
              ) : (
                <Entypo name="controller-play" size={34} color="white" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                height: "90%",
                width: "30%",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 50,
              }}
              onPress={() => save()}
            >
              <MaterialIcons name="save-alt" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SwipeUpDownModal
        modalVisible={shareModal}
        PressToanimate={animateModal}
        ContentModal={
          <View
            style={{
              height: 300,
              width: "95%",
              marginLeft: "2.5%",
              backgroundColor: "white",
              marginTop: "50%",
              borderRadius: 20,
            }}
          >
            <TouchableOpacity
              style={{
                width: "20%",
                height: 6.5,
                backgroundColor: "green",
                marginLeft: "40%",
                marginTop: 20,
                borderRadius: 10,
              }}
            ></TouchableOpacity>

            <View
              style={{
                height: 30,
                width: "100%",

                justifyContent: "center",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text
                style={{ color: "#11142D", fontSize: 18, fontWeight: "bold" }}
              >
                Input name to save route
              </Text>
            </View>

            <View
              style={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 40,
              }}
            >
              <TextInput
                style={{
                  borderWidth: 1,
                  width: "90%",
                  height: 50,
                  borderColor: "#B5302B",
                  borderRadius: 12,
                  paddingLeft: 20,
                }}
                placeholder="Enter name"
                onChangeText={(value) => setName(value)}
              />
            </View>

            <TouchableOpacity
              style={{
                height: 60,
                width: "60%",
                backgroundColor: "grey",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 30,
                alignSelf: "center",
                marginTop: 20,
              }}
              onPress={() =>
                name == "" ? showToast("Pls enter name") : save()
              }
            >
              <Text style={{ color: "white" }}> Save </Text>
            </TouchableOpacity>
          </View>
        }
        ContentModalStyle={styles.Modal}
        onClose={() => {
          setShareModal(false);
          setanimateModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

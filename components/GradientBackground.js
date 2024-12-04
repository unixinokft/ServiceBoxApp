import React from 'react'
import BG from "../assets/bg.svg";
import { Dimensions, View } from 'react-native';

const GradientBackground = () => {
    //h / w
    const BGRatio = 812 / 375

    let BGHeight = Dimensions.get("screen").height
    let BGWidth = Dimensions.get("screen").width
    const screenRatio = BGHeight / BGWidth

    //console.log("H: " + BGHeight + ", W: " + BGWidth + " BGR: " + BGRatio + ", SR: " + screenRatio)

    if (BGRatio > screenRatio) {
        BGHeight = BGWidth * BGRatio
    }

    return (
        <View
            style={{
                position: "absolute",
                top: 0,
            }}
        >
            <BG width={BGWidth} height={BGHeight} />
        </View>
    )
}

export default GradientBackground
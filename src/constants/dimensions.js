import { Dimensions } from "react-native"

const screenwidth = Dimensions.get("window").width;
const screenheight = Dimensions.get("window").height;

export const dimensions = {
    width:screenwidth,
    height:screenheight,
    sm:screenwidth * 0.035,
    md:screenwidth * 0.05,
    xl:screenwidth * 0.08
}
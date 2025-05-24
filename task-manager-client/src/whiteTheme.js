
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    config: {
        initialColorMode: "light",
        useSystemColorMode: false,
    },
    styles: {
        global: {
        body: {
            bg: "grey",
        },
        },
    },
    colors: {
        polar: {
        50: "#E9E2E2",
        100: "#D9D9D9",
        200: "#c4c4c4",
        },
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: "medium",
            },
            variants: {
                solid: {
                    bg: "polar.200",
                    color: "grey.600",
                    _hover: {
                        bg: "blue.600",
                    },
                },
            },
        },
        Divider: {
            baseStyle: {
                borderColor: "gray",
            },
        },
    },
});

export default theme;

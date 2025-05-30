
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    config: {
        initialColorMode: "light",
        useSystemColorMode: false,
    },
    styles: {
        global: {
        body: {
            bg: "rgb(228, 228, 240)",
        },
        },
    },
    colors: {
        polar: {
        50: "rgb(238, 236, 244)",
        100: "rgb(235, 231, 244)",
        200: "#c4c4c4",
        300: "#9c9c9c",
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
          color: "gray.600",
          _hover: {
            bg: "#bac8e8",
          },
          _active: {
            bg: "#9ca8c6",
            boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0)",
          },
        },
        red: {
          bg: "red.500",
          _hover: {
            bg: "red.600",
          },
          _active: {
            bg: "red.700",
            boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0)",
          },
        },
        modal: {
            bg: "rgb(9, 238, 74)",
            _hover: {
                bg: "rgb(11, 220, 66)",
            },
            _active: {
                bg: "rgb(10, 202, 64)",
                boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0)",
            },
        },
      },
      defaultProps: {
        variant: "solid",
      },
    },
        Divider: {
            baseStyle: {
                borderColor: "gray.400",
            },
        },
    },
});

export default theme;

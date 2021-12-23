import { extendTheme } from "@chakra-ui/react"

const theme = extendTheme({
  colors: {
    brand: {
      100: "#f7fafc",
      900: "#1a202c",
    },
  },  
  styles: {
    global: {
      body: {
        bg: 'gray.800',
        color: 'gray.50',
        fontWeight: 500
      },
    }
  },
})

export default theme;
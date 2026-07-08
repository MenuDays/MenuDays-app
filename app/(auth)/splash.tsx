import { View, Text, StyleSheet, Animated, Easing, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

// Crea un óvalo REAL (círculo estirado con scaleX/scaleY, no un borderRadius
// capado) y le apila varias capas más grandes y transparentes para simular
// el "layer blur" de Figma sin depender de shadow/elevation.
function VaporBlob({ width, height, opacity, style }: {
  width: number;
  height: number;
  opacity: number;
  style?: any;
}) {

  const layers = [
    { scale: 2.6, opacityFactor: 0.10 },
    { scale: 1.9, opacityFactor: 0.20 },
    { scale: 1.4, opacityFactor: 0.35 },
    { scale: 1.0, opacityFactor: 0.55 },
  ];

  return (
    <View style={[{ width, height }, style]}>
      {layers.map((layer, i) => {
        const w = width * layer.scale;
        const h = height * layer.scale;
        const maxDim = Math.max(w, h);
        const scaleX = w / maxDim;
        const scaleY = h / maxDim;

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: maxDim,
                height: maxDim,
                borderRadius: maxDim / 2,
                backgroundColor: `rgba(255,255,255,${opacity * layer.opacityFactor})`,
                transform: [{ scaleX }, { scaleY }],
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function SplashScreen() {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lidAnim = useRef(new Animated.Value(0)).current;
  const vaporOpacity = useRef(new Animated.Value(0)).current;
  const vaporY = useRef(new Animated.Value(0)).current;
  // El texto ahora arranca VISIBLE (1) y se anima hacia 0 cuando sube la tapa
  const textOpacity = useRef(new Animated.Value(1)).current;

  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Y = useRef(new Animated.Value(30)).current;

  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Y = useRef(new Animated.Value(30)).current;


  useEffect(() => {

    Animated.sequence([

      // Barra de carga (texto ya está visible desde el inicio, no se anima aquí)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),

      // Tapa sube + el texto se desvanece al mismo tiempo que se abre la tapa
      Animated.parallel([

        Animated.timing(lidAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

      ]),


      // Vapor
      Animated.parallel([

        Animated.timing(vaporOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(vaporY, {
          toValue: -8,
          duration: 700,
          useNativeDriver: true,
        }),

      ]),


      // Tarjetas
      Animated.parallel([

        Animated.timing(card1Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(card1Y, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),


        Animated.timing(card2Opacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),

        Animated.timing(card2Y, {
          toValue: 0,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),

      ]),


    ]).start(() => {

      setTimeout(() => {
        router.replace('/(auth)/onboarding');
      }, 2000);

    });



    return () => {
      progressAnim.stopAnimation();
      lidAnim.stopAnimation();
      vaporOpacity.stopAnimation();
      vaporY.stopAnimation();
      textOpacity.stopAnimation();
      card1Opacity.stopAnimation();
      card1Y.stopAnimation();
      card2Opacity.stopAnimation();
      card2Y.stopAnimation();
    };


  }, []);



  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });



  // La tapa sube más que el original (-40), pero sin desconectarse
  // del vapor/plato que quedan debajo (con -90 quedaba flotando muy lejos)
  const lidTranslateY = lidAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -55],
  });



  return (

    <View style={styles.container}>

      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={styles.background}
        resizeMode="cover"
      >


        <LinearGradient

          colors={[
            'rgba(0,0,0,0.85)',
            'rgba(0,0,0,0.30)',
            'rgba(43,30,20,0.75)',
          ]}

          style={styles.gradientOverlay}

        >


          {/* Cloche */}

          <View style={styles.clocheWrapper}>


            <Animated.View

              style={[
                styles.handle,
                {
                  transform:[
                    {
                      translateY: lidTranslateY
                    }
                  ]
                }
              ]}

            />


            <Animated.View

              style={[
                styles.lid,
                {
                  transform:[
                    {
                      translateY: lidTranslateY
                    }
                  ]
                }
              ]}

            />



            <Animated.View

              style={[
                styles.vaporContainer,
                {
                  opacity:vaporOpacity,
                  transform:[
                    {
                      translateY:vaporY
                    }
                  ]
                }
              ]}

            >

              {/* Elipse 1: 29x80, pegada a la izquierda / cerca de la bandeja */}
              <VaporBlob
                width={29}
                height={80}
                opacity={0.22}
                style={{ position:'absolute', left:2, bottom:0 }}
              />

              {/* Elipse 2: 28x70, en medio, pegada arriba */}
              <VaporBlob
                width={28}
                height={70}
                opacity={0.32}
                style={{ position:'absolute', left:38, top:0 }}
              />

              {/* Elipse 3: 18x65, a la derecha, centrada verticalmente */}
              <VaporBlob
                width={18}
                height={65}
                opacity={0.24}
                style={{ position:'absolute', left:85, top:10 }}
              />

            </Animated.View>



            <View style={styles.base}/>


          </View>





          {/* Texto */}

          <Animated.View
            style={{
              opacity:textOpacity
            }}
          >

            <Text style={styles.title}>
              MENÚ
            </Text>


            <Text style={styles.title}>
              DAYS
            </Text>



            <Text style={styles.subtitle}>

              Los mejores restaurantes de{' '}

              <Text style={styles.subtitleHighlight}>
                Ecuador
              </Text>

              {' '}en un solo lugar

            </Text>


          </Animated.View>






          {/* Tarjetas */}

          <View style={styles.cardsContainer}>


            <Animated.View

              style={[
                styles.card,
                {
                  opacity:card1Opacity,
                  transform:[
                    {
                      translateY:card1Y
                    }
                  ]
                }
              ]}

            >

              <Text style={styles.cardText}>
                🍽️ Menú del día
              </Text>

            </Animated.View>





            <Animated.View

              style={[
                styles.card,
                {
                  opacity:card2Opacity,
                  transform:[
                    {
                      translateY:card2Y
                    }
                  ]
                }
              ]}

            >

              <Text style={styles.cardText}>
                🧾 Pedidos
              </Text>

            </Animated.View>


          </View>






          {/* Barra */}

          <View style={styles.progressContainer}>


            <View style={styles.progressTrack}>


              <Animated.View

                style={[
                  styles.progressFill,
                  {
                    width:progressWidth
                  }
                ]}

              />


            </View>


          </View>




        </LinearGradient>


      </ImageBackground>


    </View>

  );
}






const styles = StyleSheet.create({


  container:{
    flex:1,
  },


  background:{
    flex:1,
  },


  gradientOverlay:{
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    paddingHorizontal:24,
  },



  clocheWrapper:{
    alignItems:'center',
    marginBottom:24,
  },


  handle:{
    width:18,
    height:18,
    borderRadius:9,
    backgroundColor:'#FFA726',
    marginBottom:-2,
    zIndex:3,
  },


  lid:{
    width:140,
    height:65,
    borderTopLeftRadius:70,
    borderTopRightRadius:70,
    backgroundColor:'#FFA726',
    zIndex:2,
  },


  base:{
    width:160,
    height:16,
    borderRadius:8,
    backgroundColor:'#FFA726',
    marginTop:2,
  },


  vaporContainer:{
    position:'absolute',
    top:-3,
    width:103,
    height:86,
    zIndex:1,
  },


  title:{
    fontSize:48,
    fontWeight:'bold',
    color:'#FFFFFF',
    textAlign:'center',
    letterSpacing:4,
    lineHeight:52,
  },


  subtitle:{
    fontSize:16,
    color:'#FFFFFF',
    textAlign:'center',
    marginTop:12,
    lineHeight:24,
  },


  subtitleHighlight:{
    color:'#FFA726',
    fontWeight:'bold',
  },


  cardsContainer:{
    flexDirection:'row',
    marginTop:32,
    marginBottom:48,
  },


  card:{
    backgroundColor:'rgba(255,255,255,0.15)',
    borderRadius:16,
    paddingHorizontal:20,
    paddingVertical:14,
    borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)',
    marginHorizontal:6,
  },


  cardText:{
    color:'#FFFFFF',
    fontSize:14,
    fontWeight:'600',
  },


  progressContainer:{
    position:'absolute',
    bottom:60,
    width:'60%',
  },


  progressTrack:{
    height:4,
    backgroundColor:'#4A4A4A',
    borderRadius:2,
    overflow:'hidden',
  },


  progressFill:{
    height:'100%',
    backgroundColor:'#FFA726',
    borderRadius:2,
  },


});
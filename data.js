window.PASAPORTE_DATA = {
  stations: [
    {
      id: 1, title: "DOMINA LAS FICHAS",
      subtitle: "Suma y resta de numeros enteros",
      questions: [
        {id:"s1q1", prompt:"+3 - 6", answer:-3, hint:"Empareja tres fichas azules con tres de las rojas. ¿Cuantas quedan?", visual:"fichas", positives:3, negatives:6},
        {id:"s1q2", prompt:"-5 + 7", answer:2, hint:"Empareja cinco parejas de colores. ¿Que color queda?", visual:"fichas", positives:7, negatives:5},
        {id:"s1q3", prompt:"-8 + 7", answer:-1, hint:"Empareja todas las fichas azules con fichas rojas.", visual:"fichas", positives:7, negatives:8},
        {id:"s1q4", prompt:"-3 + 4", answer:1, hint:"Las parejas azul-roja valen cero.", visual:"fichas", positives:4, negatives:3},
        {id:"s1q5", prompt:"+4 - 1 + 2", answer:5, hint:"Suma primero las fichas positivas y resta las negativas.", visual:"fichas", positives:6, negatives:1},
        {id:"s1q6", prompt:"+4 + 1", answer:5, hint:"Son dos movimientos en sentido positivo.", visual:"fichas", positives:5, negatives:0},
        {id:"s1q7", prompt:"-1 - 5", answer:-6, hint:"Al quitar una positiva y luego cinco positivas, ¿hacia que lado te desplazas?", visual:"fichas", positives:0, negatives:6},
        {id:"s1q8", prompt:"+9 - 5 - 4", answer:0, hint:"Empareja las fichas positivas y negativas.", visual:"fichas", positives:9, negatives:9},
        {id:"s1q9", prompt:"CREA UNA OPERACION cuyo resultado sea +3.", answer:"expression3", hint:"Puede ayudarte escribir primero 5 - 2 o usar varias operaciones.", visual:"expression"},
        {id:"s1q10", prompt:"-40 + 16", answer:-24, hint:"Empareja 16 fichas negativas con 16 positivas.", visual:"fichas", positives:16, negatives:40}
      ]
    },
    {
      id:2, title:"EXPLORADORES DEL FRIO",
      subtitle:"Diferencias de temperatura",
      questions:[
        {id:"s2q1",prompt:"Por la mañana hace 3 °C y por la tarde 10 °C. ¿Cual es la diferencia de temperatura?",answer:7,hint:"Cuenta los grados que hay desde 3 hasta 10.",visual:"temperature",temps:[3,10]},
        {id:"s2q2",prompt:"Por la mañana hace -3 °C y por la tarde -10 °C. ¿Cual es la diferencia de temperatura?",answer:7,hint:"Recorre el termometro desde -10 hasta -3.",visual:"temperature",temps:[-3,-10]},
        {id:"s2q3",prompt:"Por la mañana hace -3 °C y por la tarde 10 °C. ¿Cual es la diferencia de temperatura?",answer:13,hint:"Pasa por 0: suma los grados negativos y positivos.",visual:"temperature",temps:[-3,10]},
        {id:"s2q4",prompt:"Por la mañana hace -10 °C y por la tarde 0 °C. ¿Cual es la diferencia de temperatura?",answer:10,hint:"La diferencia es la distancia hasta el cero.",visual:"temperature",temps:[-10,0]},
        {id:"s2q5",prompt:"Por la mañana hace 0 °C y por la tarde 10 °C. ¿Cual es la diferencia de temperatura?",answer:10,hint:"Cuenta los grados desde el cero.",visual:"temperature",temps:[0,10]},
        {id:"s2q6",prompt:"Por la mañana hace -10 °C y por la tarde 10 °C. ¿Cual es la diferencia de temperatura?",answer:20,hint:"Hay 10 grados hasta cero y otros 10 despues.",visual:"temperature",temps:[-10,10]},
        {id:"s2q7",prompt:"Por la mañana hace -6 °C y por la tarde 7 °C. ¿Cual es la diferencia de temperatura?",answer:13,hint:"Suma la distancia de -6 a 0 y de 0 a 7.",visual:"temperature",temps:[-6,7]},
        {id:"s2q8",prompt:"INGENIA UNA TEMPERATURA. Inventa dos temperaturas cuya diferencia sea de 23 °C.",answer:"temperatures23",hint:"Puedes partir de 0 y buscar un numero positivo y uno negativo.",visual:"temperatures"},
        {id:"s2q9",prompt:"EL SALTO AL MAR. Pepe cayó de un avión a 100 m sobre el nivel del mar y se sumergió a 50 metros de profundidad. ¿Cuántos metros recorrió?",answer:150,hint:"Suma los metros desde 100 hasta 0 y desde 0 hasta -50.",visual:"jump"},
        {id:"s2q10",prompt:"CAMBIO DE TEMPERATURA. Si hacia 13 °C y la temperatura bajo 17 °C, ¿que temperatura hace?",answer:-4,hint:"Haz el desplazamiento hacia abajo: 13 - 17.",visual:"temperature",temps:[13,-4]}
      ]
    },
    {
      id:3,title:"REPARTOS MATEMATICOS",
      subtitle:"Division de numeros enteros",
      questions:[
        {id:"s3q1",prompt:"+9 : 3",answer:3,hint:"Reparte nueve unidades positivas en tres recipientes.",visual:"division",dividend:9,divisor:3},
        {id:"s3q2",prompt:"-10 : 2",answer:-5,hint:"Signos diferentes producen resultado negativo.",visual:"division",dividend:-10,divisor:2},
        {id:"s3q3",prompt:"-6 : 2",answer:-3,hint:"Reparte seis fichas negativas entre dos vasos.",visual:"division",dividend:-6,divisor:2},
        {id:"s3q4",prompt:"-16 : 2",answer:-8,hint:"Signos diferentes dan resultado negativo.",visual:"division",dividend:-16,divisor:2},
        {id:"s3q5",prompt:"+12 : 3",answer:4,hint:"Signos iguales producen resultado positivo.",visual:"division",dividend:12,divisor:3},
        {id:"s3q6",prompt:"-2 : 2",answer:-1,hint:"Dos fichas negativas repartidas entre dos recipientes.",visual:"division",dividend:-2,divisor:2},
        {id:"s3q7",prompt:"-9 : 3",answer:-3,hint:"Cada recipiente recibe tres fichas negativas.",visual:"division",dividend:-9,divisor:3},
        {id:"s3q8",prompt:"0 : 9",answer:0,hint:"Al repartir cero unidades no queda ninguna ficha.",visual:"division",dividend:0,divisor:9},
        {id:"s3q9",prompt:"RETO DE IMAGINACIÓN. +92 : 4",answer:23,hint:"Divide 92 en cuatro partes iguales.",visual:"division",dividend:92,divisor:4},
        {id:"s3q10",prompt:"ÚLTIMO REPARTO. -976 : 976",answer:-1,hint:"Los signos son diferentes y los valores absolutos iguales.",visual:"division",dividend:-976,divisor:976}
      ]
    }
  ],
  finalQuestions:[
    {id:"fq1",prompt:"OPERACIONES EN CADENA<br><strong>1 + 2 + 4 + 6 - 2 - 3 - 5</strong>",answer:3,hint:"Haz primero todas las sumas y despues todas las restas.",visual:"final"},
    {id:"fq2",prompt:"EL CAMBIO DE TEMPERATURA<br>Si a las 22:00 hace -6 grados y cada hora sube 2 grados, ¿que temperatura hara a las 3 de la manana?",answer:4,hint:"Desde las 22:00 hasta las 3:00 pasan cinco horas.",visual:"final"},
    {id:"fq3",prompt:"DIVISION FINAL<br><strong>-57 : (-3)</strong>",answer:19,hint:"Signos iguales: el cociente es positivo.",visual:"final"}
  ]
};

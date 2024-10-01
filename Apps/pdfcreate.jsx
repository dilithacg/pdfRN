import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const PdfCreate = () => {
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [images, setImages] = useState([]);
  const [pdfUri, setPdfUri] = useState(null);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const selectedImages = await Promise.all(
        result.assets.map(async (asset) => {
          const base64Image = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return `data:image/jpeg;base64,${base64Image}`;
        })
      );
      setImages((prevImages) => [...prevImages, ...selectedImages]);
    }
  };

  const generatePDF = async () => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    const currentDate = new Intl.DateTimeFormat("en-US", options).format(
      new Date()
    );

    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              padding: 20px;
              font-family: Arial, sans-serif;
              margin: 0;
              background-color: #f8f8f8;
            }
            h1 {
              font-size: 26px;
              text-align: center;
              margin-bottom: 20px;
              color: #333;
            }
            p {
              font-size: 18px;
              margin-bottom: 10px;
              color: #555;
            }
            .container {
              text-align: center;
              margin-top: 20px;
            }
            .image {
              width: 150px;
              height: 150px;
              object-fit: cover;
              margin: 10px;
              border-radius: 8px;
              border: 1px solid #ccc;
            }
          </style>
        </head>
        <body>
          <h1>Prosports</h1>
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Place:</strong> ${place}</p>
          <div class="container">
            ${images
              .map((image) => `<img class="image" src="${image}" />`)
              .join("")}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
      });

      const pdfUri = `${FileSystem.documentDirectory}UserDetails.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: pdfUri,
      });

      setPdfUri(pdfUri);
      Alert.alert("PDF Generated", `PDF saved to: ${pdfUri}`);
    } catch (error) {
      Alert.alert("Error", "Failed to generate or save PDF");
      console.error(error);
    }
  };

  const viewPDF = async () => {
    if (pdfUri) {
      try {
        await Sharing.shareAsync(pdfUri);
      } catch (error) {
        Alert.alert("Error", "Failed to open PDF");
        console.error(error);
      }
    } else {
      Alert.alert("No PDF Generated", "Please generate the PDF first.");
    }
  };

  const options = { day: "numeric", month: "long", year: "numeric" };
  const currentDate = new Intl.DateTimeFormat("en-US", options).format(
    new Date()
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Prosports</Text>
      <Text style={styles.dateText}>{currentDate}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Place"
          value={place}
          onChangeText={setPlace}
          style={styles.input}
        />

        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>

      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Pick Images</Text>
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        {images.map((image, index) => (
          <Image key={index} source={{ uri: image }} style={styles.image} />
        ))}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
          <Text style={styles.pdfButtonText}>Generate PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pdfButton,
            { backgroundColor: !pdfUri ? "#ccc" : "#28a745" },
          ]}
          onPress={viewPDF}
          disabled={!pdfUri}
        >
          <Text style={styles.pdfButtonText}>View PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PdfCreate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
    textAlign: "center",
    color: "#333",
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    marginBottom: 20,

    textAlign: "center",
    color: "#666",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  actionContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: "80%",
    alignItems: "center",
  },
  pdfButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

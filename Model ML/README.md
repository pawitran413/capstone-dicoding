# Capstone Proyek: Prediksi Penyakit Tanaman Berbasis Citra

Proyek ini bertujuan untuk membangun model deep learning yang dapat mengklasifikasikan penyakit pada daun tanaman berdasarkan citra/gambar. Model ini menggunakan TensorFlow dan Keras, serta dapat diekspor ke format TFLite dan TensorFlow.js untuk kebutuhan deployment di perangkat mobile maupun web.

## Tautan Dataset Publik

**Dataset yang digunakan adalah Plant Disease Classification Merged Dataset (https://www.kaggle.com/datasets/alinedobrovsky/plant-disease-classification-merged-dataset).**
Namun, dari keseluruhan dataset tersebut, kami hanya mengambil empat jenis tanaman yaitu cabai (chili), jagung (corn), padi (rice), dan tomat (tomato) dengan total 16 kelas yang digunakan untuk membangun model prediksi.  
Adapun kelas-kelas yang digunakan adalah sebagai berikut:

- **Chili:** leaf curl, leaf spot, whitefly, healthy  
- **Corn:** common rust, gray leaf spot, northern leaf blight, healthy  
- **Rice:** brown spot, leaf blast, neck blast, healthy  
- **Tomato:** early blight, late blight, yellow leaf curl virus, healthy  

link dataset digunakan: https://drive.google.com/file/d/15Faf9DT4xhEXUkDTHMTULU_4stjx9dFt/view?usp=sharing

## Fitur Utama

- **Preprocessing Dataset**: Ekstraksi, pembagian dataset ke train/validation/test, dan augmentasi gambar.
- **Arsitektur Model**: CNN custom dengan regularisasi dan dropout untuk mengurangi overfitting.
- **Training & Evaluasi**: Training dengan callback (EarlyStopping, ReduceLROnPlateau, ModelCheckpoint) dan visualisasi hasil.
- **Konversi Model**: Mendukung ekspor ke format SavedModel, TFLite, dan TensorFlow.js.
- **Inference**: Prediksi gambar baru menggunakan model TFLite.

## Struktur Folder

```
Model CP/
│
├── model.py / Model.ipynb      # Script utama model (bisa .py atau .ipynb)
├── requirements.txt            # Daftar dependensi Python
└── README.md
```

## Cara Menjalankan

1. **Install Dependensi**
    ```bash
    pip install -r requirements.txt
    ```

2. **Siapkan Dataset**
    - Letakkan file ZIP dataset di folder yang sesuai.
    - Jalankan script untuk ekstraksi dan split dataset.

3. **Training Model**
    - Jalankan `model.py` atau `Model.ipynb` untuk melatih model.
    - Model terbaik akan otomatis disimpan.

4. **Evaluasi & Visualisasi**
    - Script akan menampilkan grafik akurasi dan loss.

5. **Konversi Model**
    - Model dapat diekspor ke format TFLite dan TensorFlow.js.

6. **Inference**
    - Gunakan fungsi `tflite_inference` untuk prediksi gambar baru.



> **Catatan:**  
> Jika menggunakan Google Colab, library `google.colab` sudah tersedia. Untuk konversi ke TensorFlow.js, install juga `tensorflowjs`.

## Link Hasil Simpan Model

Folder berikut berisi hasil simpan model yang telah dilatih, meliputi model terbaik, SavedModel, TFLite, dan TensorFlow.js:

```
models/
│   ├── best_model.keras        # Model hasil training terbaik
│   ├── saved_model/            # Model format SavedModel
│   ├── tflite/
│   │   ├── model.tflite        # Model TFLite
│   │   └── label.txt           # Label kelas untuk TFLite
│   └── tfjs_model/
```

Link Google Drive hasil simpan model:  
https://drive.google.com/drive/folders/1pvt3cw5X002MeCDWqcIcr1Y2gPqxnR8h?usp=sharing

## Lisensi

Proyek ini dibuat untuk keperluan pembelajaran dan tugas akhir.

---

**Penulis:**  
Tim ML :  
MC579D5X2148 – Dina Prastuti  
MC579D5Y2036 – Muhammad Surya Safar  
MC229D5Y0731 - Rahmat Amalul Ahlin  
2025

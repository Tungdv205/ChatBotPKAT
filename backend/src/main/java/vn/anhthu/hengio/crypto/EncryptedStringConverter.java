package vn.anhthu.hengio.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Gắn @Convert(converter = EncryptedStringConverter.class) lên một cột để lưu vào database dưới dạng đã mã hóa. */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    @Override
    public String convertToDatabaseColumn(String attribute) {
        return CryptoService.get().encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return CryptoService.get().decrypt(dbData);
    }
}
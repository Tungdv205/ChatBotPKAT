package vn.anhthu.hengio.repo;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.anhthu.hengio.model.Appointment;
import vn.anhthu.hengio.model.ApptStatus;

public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findByUserIdOrderByDateDescStartMinDesc(Long userId);

    List<Appointment> findByStaffIdAndDateAndStatusNot(String staffId, LocalDate date, ApptStatus status);

    List<Appointment> findByUserIdAndDateAndStatusNot(Long userId, LocalDate date, ApptStatus status);

    void deleteByUserId(Long userId);

    // Dành cho trang quản trị
    List<Appointment> findTop500ByOrderByDateDescStartMinDesc();

    long countByUserId(Long userId);

    long countByDateAndStatusNot(LocalDate date, ApptStatus status);

    @Query("select coalesce(sum(a.total), 0) from Appointment a where a.status <> :s")
    long sumTotalExcluding(@Param("s") ApptStatus status);
}
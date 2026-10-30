package com.unix.aiupskilling.mentor.repository;

import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface SkillAchievementRepository extends JpaRepository<SkillAchievement, UUID>, JpaSpecificationExecutor<SkillAchievement> {

    List<SkillAchievement> findAllByStudentUserId(Long studentUserId);

    List<SkillAchievement> findAllByStudentUserIdIn(Collection<Long> studentUserIds);

    Page<SkillAchievement> findByStudentUserIdIn(Collection<Long> studentUserIds, Pageable pageable);

    long countByStudentUserIdIn(Collection<Long> studentUserIds);
}

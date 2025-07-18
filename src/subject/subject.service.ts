import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        name: dto.name
      }
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        skip,
        take: limit,
        include: {
          teachers: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            }
          },
          grades: true
        }
      }),
      this.prisma.subject.count()
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit
      }
    };
  }

  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        grades: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!subject) {
      throw new NotFoundException('Subject tidak ditemukan');
    }

    return subject;
  }

  
  async getTotalSubjects() {
    const total = await this.prisma.subject.count();
    return { total };
  }

  async update(id: number, dto: UpdateSubjectDto) {
    return this.prisma.subject.update({
      where: { id },
      data: dto
    });
  }

  async delete(id: number) {
    return this.prisma.subject.delete({
      where: { id }
    });
  }

  async assignTeacher(subjectId: number, dto: AssignTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId }
    });

    if (!teacher) {
      throw new NotFoundException('Guru tidak ditemukan');
    }

    return this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        teachers: {
          connect: { id: dto.teacherId }
        }
      }
    });
  }

  async unassignTeacher(subjectId: number, dto: AssignTeacherDto) {
    return this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        teachers: {
          disconnect: { id: dto.teacherId }
        }
      }
    });
  }
}

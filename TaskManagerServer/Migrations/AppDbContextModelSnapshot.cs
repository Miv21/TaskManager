﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using TaskManagerServer;

#nullable disable

namespace TaskManagerServer.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.4")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("TaskManagerServer.Models.Department", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Departments");
                });

            modelBuilder.Entity("TaskManagerServer.Models.Position", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Positions");
                });

            modelBuilder.Entity("TaskManagerServer.Models.Role", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Roles");

                    b.HasData(
                        new
                        {
                            Id = 1,
                            Name = "Employer"
                        },
                        new
                        {
                            Id = 2,
                            Name = "Employee"
                        },
                        new
                        {
                            Id = 3,
                            Name = "Admin"
                        },
                        new
                        {
                            Id = 4,
                            Name = "TopeEmployer"
                        });
                });

            modelBuilder.Entity("TaskManagerServer.Models.TaskCard", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("Deadline")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("EmployerId")
                        .HasColumnType("integer");

                    b.Property<string>("FileUrl")
                        .HasColumnType("text");

                    b.Property<int?>("TargetUserId")
                        .HasColumnType("integer");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("EmployerId");

                    b.HasIndex("TargetUserId");

                    b.ToTable("Tasks");
                });

            modelBuilder.Entity("TaskManagerServer.Models.TaskResponse", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<DateTime>("Deadline")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("EmployeeId")
                        .HasColumnType("integer");

                    b.Property<int>("EmployerId")
                        .HasColumnType("integer");

                    b.Property<string>("FileUrl")
                        .HasColumnType("text");

                    b.Property<string>("OriginalFileUrl")
                        .HasColumnType("text");

                    b.Property<string>("ResponseText")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime>("SubmittedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<int?>("TaskCardId")
                        .HasColumnType("integer");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("EmployeeId");

                    b.HasIndex("TaskCardId");

                    b.ToTable("TaskResponses");
                });

            modelBuilder.Entity("TaskManagerServer.Models.User", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<byte[]>("Avatar")
                        .HasColumnType("bytea");

                    b.Property<string>("AvatarContentType")
                        .HasColumnType("text");

                    b.Property<int?>("DepartmentId")
                        .HasColumnType("integer");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Login")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("PositionId")
                        .HasColumnType("integer");

                    b.Property<int>("RoleId")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("DepartmentId");

                    b.HasIndex("PositionId");

                    b.HasIndex("RoleId");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("TaskManagerServer.Models.TaskCard", b =>
                {
                    b.HasOne("TaskManagerServer.Models.User", "Employer")
                        .WithMany("CreatedTasks")
                        .HasForeignKey("EmployerId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("TaskManagerServer.Models.User", "TargetUser")
                        .WithMany()
                        .HasForeignKey("TargetUserId")
                        .OnDelete(DeleteBehavior.Restrict);

                    b.Navigation("Employer");

                    b.Navigation("TargetUser");
                });

            modelBuilder.Entity("TaskManagerServer.Models.TaskResponse", b =>
                {
                    b.HasOne("TaskManagerServer.Models.User", "Employee")
                        .WithMany("Responses")
                        .HasForeignKey("EmployeeId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("TaskManagerServer.Models.TaskCard", null)
                        .WithMany("Responses")
                        .HasForeignKey("TaskCardId");

                    b.Navigation("Employee");
                });

            modelBuilder.Entity("TaskManagerServer.Models.User", b =>
                {
                    b.HasOne("TaskManagerServer.Models.Department", "Department")
                        .WithMany("Users")
                        .HasForeignKey("DepartmentId");

                    b.HasOne("TaskManagerServer.Models.Position", "Position")
                        .WithMany("Users")
                        .HasForeignKey("PositionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("TaskManagerServer.Models.Role", "Role")
                        .WithMany("Users")
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Department");

                    b.Navigation("Position");

                    b.Navigation("Role");
                });

            modelBuilder.Entity("TaskManagerServer.Models.Department", b =>
                {
                    b.Navigation("Users");
                });

            modelBuilder.Entity("TaskManagerServer.Models.Position", b =>
                {
                    b.Navigation("Users");
                });

            modelBuilder.Entity("TaskManagerServer.Models.Role", b =>
                {
                    b.Navigation("Users");
                });

            modelBuilder.Entity("TaskManagerServer.Models.TaskCard", b =>
                {
                    b.Navigation("Responses");
                });

            modelBuilder.Entity("TaskManagerServer.Models.User", b =>
                {
                    b.Navigation("CreatedTasks");

                    b.Navigation("Responses");
                });
#pragma warning restore 612, 618
        }
    }
}

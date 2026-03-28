allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// Chỉnh sửa phần cấu hình Build Directory an toàn hơn
val rootBuildDir = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(rootBuildDir)

subprojects {
    // Chỉ định thư mục build cho từng subproject dựa trên rootBuildDir
    val newSubprojectBuildDir = rootBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
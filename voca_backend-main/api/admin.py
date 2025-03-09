from django.contrib import admin

from .models import Report, vocaUser, Key

# Register your models here.
class vocaUser_admin(admin.ModelAdmin):
    readonly_fields = ["unique_key"]

class report_admin(admin.ModelAdmin):
    readonly_fields = ["reportID", "owner"]


admin.site.register(vocaUser, vocaUser_admin)
admin.site.register(Report, report_admin)
admin.site.register(Key)
